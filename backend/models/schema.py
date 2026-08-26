"""
CLEARCUT Core Data Models & Schemas

Typed Pydantic definitions modeling Hollywood production clearance workflows:
- Artifact classification (screenplays, storyboards, prop specs, footage)
- Clearance case management and legal status tracking
- Semantic revision diffs and impact classifications
- Parallel Search evidence runs and source provenance
- Cross-department propagation dependency records
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ArtifactType(str, Enum):
    """Types of production assets monitored across the clearance lifecycle."""
    SCRIPT = "SCRIPT"
    STORYBOARD = "STORYBOARD"
    PROP_IMAGE = "PROP_IMAGE"
    ARTWORK = "ARTWORK"
    LOCATION_REFERENCE = "LOCATION_REFERENCE"
    FOOTAGE = "FOOTAGE"
    MUSIC_CUE = "MUSIC_CUE"
    LICENSE = "LICENSE"
    RELEASE = "RELEASE"
    OTHER = "OTHER"


class ClearanceCategory(str, Enum):
    """Intellectual property and legal clearance risk taxonomy."""
    TRADEMARK = "TRADEMARK"
    COPYRIGHT = "COPYRIGHT"
    MUSIC = "MUSIC"
    ARTWORK = "ARTWORK"
    PERSON_OR_LIKENESS = "PERSON_OR_LIKENESS"
    BUSINESS_OR_ORGANIZATION = "BUSINESS_OR_ORGANIZATION"
    PRODUCT = "PRODUCT"
    LOCATION_OR_SIGNAGE = "LOCATION_OR_SIGNAGE"
    FACTUAL_CLAIM = "FACTUAL_CLAIM"
    DEFAMATION_REVIEW = "DEFAMATION_REVIEW"
    OFFICIAL_SYMBOL = "OFFICIAL_SYMBOL"
    FOOTAGE_OR_ARCHIVAL_MEDIA = "FOOTAGE_OR_ARCHIVAL_MEDIA"
    RELEASE_OR_CONSENT = "RELEASE_OR_CONSENT"
    AI_PROVENANCE = "AI_PROVENANCE"
    OTHER = "OTHER"


class CaseStatus(str, Enum):
    """Current stage in the clearance legal decision pipeline."""
    UNREVIEWED = "UNREVIEWED"
    RESEARCH_REQUIRED = "RESEARCH_REQUIRED"
    RESEARCHING = "RESEARCHING"
    REVIEW = "REVIEW"
    COUNSEL = "COUNSEL"
    CLEARED = "CLEARED"
    RESOLVED = "RESOLVED"
    BLOCKED = "BLOCKED"


class Fictionality(str, Enum):
    """Status of an entity's real-world commercial vs fictional existence."""
    FICTIONAL = "FICTIONAL"
    REAL = "REAL"
    UNKNOWN = "UNKNOWN"
    PARTIALLY_REAL = "PARTIALLY_REAL"


class ResolutionType(str, Enum):
    """Methods used to legally resolve an open clearance issue."""
    LICENSE_OBTAINED = "LICENSE_OBTAINED"
    FICTIONALIZE = "FICTIONALIZE"
    FAIR_USE_LEGAL_MEMO = "FAIR_USE_LEGAL_MEMO"
    RELEASE_SIGNED = "RELEASE_SIGNED"
    PUBLIC_DOMAIN_VERIFIED = "PUBLIC_DOMAIN_VERIFIED"
    REMOVED_FROM_CUT = "REMOVED_FROM_CUT"
    BLUR_OR_VFX_REPLACEMENT = "BLUR_OR_VFX_REPLACEMENT"
    INSURANCE_APPROVED = "INSURANCE_APPROVED"


class Production(BaseModel):
    """Production metadata for the active film/television project."""
    id: str
    title: str
    description: str = ""
    status: str = "IN_PRODUCTION"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ArtifactVersion(BaseModel):
    """Versioned snapshot of a production asset (e.g. Blue Draft v7, Pink Draft v8)."""
    id: str
    artifact_id: str
    version_label: str
    mime_type: Optional[str] = "text/plain"
    checksum: Optional[str] = None
    content_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Artifact(BaseModel):
    """A tracked production asset linked to clearance cases."""
    id: str
    production_id: str
    type: Optional[ArtifactType] = None
    artifact_type: Optional[ArtifactType] = None
    name: str
    department: Optional[str] = None
    current_version_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def __init__(self, **data):
        if "type" in data and "artifact_type" not in data:
            data["artifact_type"] = data["type"]
        elif "artifact_type" in data and "type" not in data:
            data["type"] = data["artifact_type"]
        super().__init__(**data)


class ClearanceEntity(BaseModel):
    """Canonical rights-bearing subject tracked across production drafts."""
    id: str
    production_id: str
    canonical_name: str
    entity_type: ClearanceCategory
    fictionality: Fictionality = Fictionality.UNKNOWN
    created_at: datetime = Field(default_factory=datetime.utcnow)
    aliases: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Mention(BaseModel):
    """Specific textual or visual occurrence of a ClearanceEntity in an artifact."""
    id: str
    entity_id: str
    artifact_version_id: str
    location: Optional[str] = ""
    scene: Optional[str] = None
    text_context: str
    clearance_status: CaseStatus = CaseStatus.UNREVIEWED
    confidence: float = 0.95


class EvidenceSource(BaseModel):
    """A grounded web source or USPTO citation retrieved via Parallel Search."""
    id: str
    research_run_id: str
    title: str
    url: str
    domain: str
    excerpt: str
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)


class ResearchRun(BaseModel):
    """Record of an automated clearance research investigation via Parallel Search."""
    id: str
    case_id: str
    objective: str
    queries: List[str]
    status: str = "COMPLETED"
    started_at: datetime
    completed_at: Optional[datetime] = None
    agent_run_id: Optional[str] = None
    results: List[EvidenceSource] = Field(default_factory=list)
    synthesis: Dict[str, Any] = Field(default_factory=dict)


class CaseResolution(BaseModel):
    """Resolution details recorded when a clearance issue is approved by counsel."""
    id: Optional[str] = None
    case_id: Optional[str] = None
    type: Optional[ResolutionType] = None
    resolution_type: Optional[ResolutionType] = None
    proposed_by: Optional[str] = None
    replacement_value: Optional[str] = None
    notes: str = ""
    approved_by: str = ""
    resolved_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: Optional[datetime] = None
    memo_id: Optional[str] = None

    def __init__(self, **data):
        if "resolution_type" in data and "type" not in data:
            data["type"] = data["resolution_type"]
        elif "type" in data and "resolution_type" not in data:
            data["resolution_type"] = data["type"]
        super().__init__(**data)


# Alias for backward compatibility
Resolution = CaseResolution


class ClearanceCase(BaseModel):
    """Core stateful clearance tracking dossier."""
    id: str
    production_id: str
    entity_id: str
    category: ClearanceCategory
    status: CaseStatus = CaseStatus.UNREVIEWED
    priority: str = "MEDIUM"  # LOW | MEDIUM | HIGH | URGENT
    owner: Optional[str] = None
    assignee_id: Optional[str] = None
    summary: str
    reason: Optional[str] = None
    invalidated_reason: Optional[str] = None
    previous_case_id: Optional[str] = None
    created_from_change_id: Optional[str] = None
    unresolved_questions: List[str] = Field(default_factory=list)
    established_facts: List[str] = Field(default_factory=list)
    latest_research: Optional[ResearchRun] = None
    resolution: Optional[CaseResolution] = None
    confidence: float = 0.95
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AuditEvent(BaseModel):
    """Immutable log entry recording changes, decisions, and invalidations."""
    id: str
    production_id: Optional[str] = None
    actor_type: Optional[str] = "SYSTEM"
    actor_id: Optional[str] = "CLEARCUT_CORE"
    actor: Optional[str] = None
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    details: Dict[str, Any] = Field(default_factory=dict)
    case_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SemanticChangeItem(BaseModel):
    """Individual screenplay revision change extracted and categorized by Gemini."""
    change_id: str
    scene: str
    page: int = 0
    change_type: str  # ENTITY_REPLACED | ENTITY_ADDED | DIALOGUE_TWEAK | etc.
    old_text: str
    new_text: str
    old_entities: List[str] = Field(default_factory=list)
    new_entities: List[str] = Field(default_factory=list)
    clearance_impact: bool = False
    impact_categories: List[ClearanceCategory] = Field(default_factory=list)
    affected_case_ids: List[str] = Field(default_factory=list)
    explanation: str = ""
    recommended_next_step: str = "NONE"
    confidence: float = 0.95


class RevisionAnalysisResult(BaseModel):
    """Complete revision collation diff result comparing two screenplay drafts."""
    artifact_version_from: str
    artifact_version_to: str
    total_changes_count: int
    clearance_changes_count: int
    hero_message: str
    changes: List[SemanticChangeItem] = Field(default_factory=list)
    affected_cases: List[ClearanceCase] = Field(default_factory=list)


class FictionalCandidate(BaseModel):
    """AI-generated candidate fictional replacement brand and conflict verification."""
    candidate_name: str
    rational: str
    conflict_search_queries: List[str] = Field(default_factory=list)
    conflict_found: bool = False
    conflict_confidence: str = "NONE"
    conflict_summary: str = ""
    parallel_sources: List[EvidenceSource] = Field(default_factory=list)
    disclaimer: str = "This is a research aid, not trademark clearance or legal guarantee."


class PropagationItem(BaseModel):
    """Downstream production artifact dependency (Props, Storyboard, VFX, Rough Cut)."""
    artifact_type: ArtifactType
    artifact_id: str
    artifact_name: str
    version_label: str
    location: str
    current_status: str  # RESOLVED | AFFECTED_OLD_ENTITY_PRESENT | PENDING_REVIEW
    snippet_or_label: str
    department: str
    recommended_task: str


class PropagationCheckResult(BaseModel):
    """Multi-department audit tracing physical downstream assets after a script revision."""
    case_id: str
    resolved_entity_name: str
    replacement_name: str
    status: str  # COMPLETE | INCOMPLETE
    hero_message: str
    items: List[PropagationItem] = Field(default_factory=list)
    tasks_created: bool = False


class ProductionSummary(BaseModel):
    """Executive studio telemetry and readiness payload."""
    production: Production
    readiness: Dict[str, Any]
    urgent_cases: List[ClearanceCase] = Field(default_factory=list)
    all_cases: List[ClearanceCase] = Field(default_factory=list)
    latest_revision_analysis: Optional[RevisionAnalysisResult] = None
    audit_events: List[Dict[str, Any]] = Field(default_factory=list)
