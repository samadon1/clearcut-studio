"""
Artifact Intelligence Agent.

Computes a real semantic clearance diff between two screenplay drafts using Gemini.
It separates ordinary craft edits (pacing, wording, blocking, camera) from changes
that introduce or alter a real-world, rights-relevant element. Nothing here is
hardcoded per-entity; the diff is whatever Gemini finds in the supplied text.
"""
import asyncio
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from models.schema import (
    SemanticChangeItem,
    ClearanceCategory,
    RevisionAnalysisResult,
    ArtifactType,
)
from tools import gemini

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
VALID_CATEGORIES = {c.value for c in ClearanceCategory}

SYSTEM_INSTRUCTION = (
    "You are CLEARCUT's Artifact Intelligence Agent for film and television production. "
    "You compare two screenplay drafts and identify every substantive change between them. "
    "For each change decide clearance_impact:\n"
    "- FALSE for ordinary craft edits: dialogue rewording, pacing, blocking, camera notes, "
    "description polish, or renaming a purely fictional element to another fictional one.\n"
    "- TRUE only when the change introduces or alters a REAL, identifiable, rights-protected "
    "element: a real brand or trademark, a real company, a specific copyrighted artwork, a real "
    "person or their likeness, a commercially released song, a real product, real signage or a "
    "real location, or potentially defamatory material about a real party. Also TRUE when a "
    "previously fictional element is replaced by something real.\n"
    "Whenever a real, NAMED, rights-bearing thing appears where there was none before, you MUST mark "
    "clearance_impact TRUE. This always includes: a named real artist's artwork (e.g. a Banksy piece), "
    "a named real commercial brand or company, and a named commercially released song or its performer. "
    "Treat each such introduction as its own separate change; never merge two distinct clearance-relevant "
    "changes into one item. Ordinary craft edits stay FALSE. "
    "You are not a lawyer and do not decide legality; you flag clearance workflow impact."
)


class _GChange(BaseModel):
    scene: str = Field(description="Scene heading or number where the change occurs")
    change_type: str = Field(description="ENTITY_REPLACED | ENTITY_ADDED | ENTITY_REMOVED | DIALOGUE_TWEAK | ACTION_EDIT")
    old_text: str
    new_text: str
    old_entities: List[str] = Field(default_factory=list)
    new_entities: List[str] = Field(default_factory=list)
    clearance_impact: bool
    impact_categories: List[str] = Field(default_factory=list, description="Zero or more CLEARCUT clearance category codes")
    explanation: str
    recommended_next_step: str = Field(default="REVIEW", description="NONE | REVIEW | COUNSEL | RESEARCH_REQUIRED")
    confidence: float = 0.9


class _GDiff(BaseModel):
    changes: List[_GChange]


BREAKDOWN_SYSTEM = (
    "You are CLEARCUT producing a SCRIPT CLEARANCE REPORT (a 'neg check') for a film/TV screenplay. "
    "Read the script and identify every element that could trigger a copyright, trademark, publicity, "
    "privacy, or defamation issue and therefore needs clearance: real or potentially-real brands and "
    "trademarks, products, business or organization names, real people or their likeness, specific "
    "copyrighted artworks, commercially released music or film clips, identifiable real locations or "
    "landmarks, and potentially defamatory references to real parties.\n"
    "For EACH element provide: the scene, the EXACT quoted text where it appears (verbatim, for "
    "highlighting), its category code, whether it is FICTIONAL / REAL / UNKNOWN, a risk level "
    "(RED = clear real rights-bearing thing needing action, AMBER = needs research/review, "
    "GREEN = likely clear or plainly fictional), why it matters, and a recommended action "
    "(RESEARCH, FICTIONALIZE, LICENSE, COUNSEL, or CLEAR).\n"
    "Always choose the MOST SPECIFIC category and avoid OTHER unless nothing fits: a named venue or "
    "company is BUSINESS_OR_ORGANIZATION, a real place or landmark is LOCATION_OR_SIGNAGE, a named real "
    "person is PERSON_OR_LIKENESS, a named song is MUSIC, a named artwork is ARTWORK, a named product or "
    "brand is TRADEMARK or PRODUCT. Include references to real public figures (e.g. a named politician).\n"
    "Do NOT list ordinary fictional inventions with no real-world collision. Do NOT do a production "
    "breakdown (no cast, wardrobe, props-for-scheduling). Clearance-relevant elements only. "
    "You are not a lawyer and do not decide legality."
)


class _BElement(BaseModel):
    name: str = Field(description="Canonical name of the element, e.g. 'Northstar Coffee'")
    category: str = Field(description="A CLEARCUT clearance category code")
    scene: str = Field(description="Scene heading or number where it appears")
    quote: str = Field(description="Exact verbatim text from the script where it appears")
    fictionality: str = Field(default="UNKNOWN", description="FICTIONAL | REAL | UNKNOWN")
    risk: str = Field(default="AMBER", description="RED | AMBER | GREEN")
    why: str
    recommended_action: str = Field(default="RESEARCH", description="RESEARCH | FICTIONALIZE | LICENSE | COUNSEL | CLEAR")
    assignee_id: str = Field(default="", description="Id of the single best-fit team member to own this element, chosen from the provided ROSTER by role fit. Empty string if none clearly fits.")


class _Breakdown(BaseModel):
    elements: List[_BElement]


class ArtifactAgent:
    def __init__(self):
        self.model = gemini.model_name()

    def _read(self, filename: str) -> str:
        path = DATA_DIR / filename
        return path.read_text(encoding="utf-8") if path.exists() else ""

    async def analyze_revision(
        self,
        from_version: str = "script-v7",
        to_version: str = "script-v8",
        content: Optional[str] = None,
        old_content: Optional[str] = None,
    ) -> RevisionAnalysisResult:
        old_script = old_content or self._read("blue_v7.txt")
        new_script = content or self._read("pink_v8.txt")

        prompt = (
            "Compare these two drafts of the same screenplay. Identify every substantive change, "
            "scene by scene, and classify each per your instructions. Return strict JSON.\n\n"
            f"=== OLD DRAFT ({from_version}) ===\n{old_script}\n\n"
            f"=== NEW DRAFT ({to_version}) ===\n{new_script}\n"
        )

        diff: _GDiff = await asyncio.to_thread(
            gemini.generate_structured,
            prompt,
            _GDiff,
            SYSTEM_INSTRUCTION,
        )

        changes: List[SemanticChangeItem] = []
        for i, ch in enumerate(diff.changes, 1):
            cats = [ClearanceCategory(c) for c in ch.impact_categories if c in VALID_CATEGORIES]
            changes.append(
                SemanticChangeItem(
                    change_id=f"chg-{i:03d}",
                    scene=str(ch.scene),
                    page=0,
                    change_type=ch.change_type,
                    old_text=ch.old_text,
                    new_text=ch.new_text,
                    old_entities=ch.old_entities,
                    new_entities=ch.new_entities,
                    clearance_impact=ch.clearance_impact,
                    impact_categories=cats,
                    affected_case_ids=[],
                    explanation=ch.explanation,
                    recommended_next_step=ch.recommended_next_step,
                    confidence=ch.confidence,
                )
            )

        clearance_changes = [c for c in changes if c.clearance_impact]
        n, m = len(changes), len(clearance_changes)
        hero = (
            f"{n} change{'s' if n != 1 else ''} detected. Only {m} affect clearance."
            if m else f"{n} change{'s' if n != 1 else ''} detected. None affect clearance."
        )

        return RevisionAnalysisResult(
            artifact_version_from=from_version,
            artifact_version_to=to_version,
            total_changes_count=n,
            clearance_changes_count=m,
            hero_message=hero,
            changes=changes,
            affected_cases=[],
        )

    async def breakdown_script(self, script_text: str, roster: Optional[List[Dict[str, Any]]] = None) -> List[_BElement]:
        """Single-script clearance report: segment into rights-relevant elements.
        If a roster is given, Gemini assigns each element to the best-fit member by role."""
        roster_block = ""
        if roster:
            lines = "\n".join(f"- {m['id']} | {m['name']} | {m['role']}" for m in roster)
            roster_block = (
                "\nASSIGN each element to the single best-fit team member by ROLE fit (music to the "
                "music supervisor, artwork/visual to the art director, real people or defamation to "
                "counsel, and so on). Set assignee_id to that member's id, copied EXACTLY from this "
                f"ROSTER:\n{lines}\n"
            )
        prompt = (
            "Produce the clearance report for this screenplay. Identify every clearance-relevant "
            "element, scene by scene, per your instructions. Return strict JSON.\n"
            f"{roster_block}\n"
            f"=== SCREENPLAY ===\n{script_text}\n"
        )
        result: _Breakdown = await asyncio.to_thread(
            gemini.generate_structured, prompt, _Breakdown, BREAKDOWN_SYSTEM
        )
        return result.elements

    async def analyze_visual_artifact(
        self,
        artifact_type: ArtifactType,
        name: str,
        image_bytes: Optional[bytes] = None,
        mime_type: str = "image/png",
    ) -> Dict[str, Any]:
        """
        Real multimodal detection (P1). With image bytes, Gemini inspects the frame for
        clearance-relevant marks. With no image we return an honest empty result rather
        than inventing detections.
        """
        if not image_bytes:
            return {
                "artifact_type": artifact_type,
                "detected_entities": [],
                "confidence": 0.0,
                "linked_case_id": None,
                "notes": "No image supplied; visual analysis not performed.",
            }

        class _Detection(BaseModel):
            detected_entities: List[str] = Field(default_factory=list)
            has_clearance_relevant_mark: bool = False
            notes: str = ""
            confidence: float = 0.0

        prompt = (
            f"This is a {artifact_type.value} named '{name}' from a film production. "
            "Identify any visible brand logos, trademarks, recognizable copyrighted artwork, "
            "product packaging, real signage, or identifiable real people. List what you actually "
            "see; do not guess. Return strict JSON."
        )
        det: _Detection = await asyncio.to_thread(
            gemini.generate_structured,
            prompt,
            _Detection,
            "You are CLEARCUT's visual clearance detector. Report only what is visibly present.",
            [{"data": image_bytes, "mime_type": mime_type}],
        )
        return {
            "artifact_type": artifact_type,
            "detected_entities": det.detected_entities,
            "confidence": det.confidence,
            "linked_case_id": None,
            "notes": det.notes,
        }
