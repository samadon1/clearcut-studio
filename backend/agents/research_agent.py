"""
Research Agent.

The only clearance-research engine in CLEARCUT. For a case it:
  1. Uses Gemini to plan a narrow objective and 2-3 focused queries.
  2. Runs the live Parallel Search API.
  3. Uses Gemini to synthesize a verdict grounded ONLY in the returned sources.

Hard rule: if Parallel returns no sources, we do not invent a conclusion. The case
stays unresolved and is routed to human/counsel review.
"""
import asyncio
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from models.schema import (
    ResearchRun,
    EvidenceSource,
    CaseStatus,
    ClearanceCategory,
)
from tools.parallel_search import parallel_search
from tools import gemini

_VALID_STATUS = {s.value for s in CaseStatus}
DISCLAIMER = "CLEARCUT assists production clearance research. This is a research aid, not legal advice."

PLAN_SYSTEM = (
    "You are CLEARCUT's research planner. Given a clearance entity and its scene context, "
    "write one precise research objective and 2-3 focused web search queries that would establish "
    "whether the entity is a real, rights-protected thing and what a production would need to clear it. "
    "Prefer queries that surface trademark registers, official rights holders, and authoritative sources."
)

SYNTH_SYSTEM = (
    "You are CLEARCUT's evidence synthesizer for film/TV clearance. You are given a set of web sources "
    "returned by live search. Rules:\n"
    "- Base every established fact ONLY on the provided sources; do not use outside knowledge or invent facts.\n"
    "- Reference sources by their domain when stating a fact.\n"
    "- If the sources do not resolve a question, put it in unresolved_questions.\n"
    "- Never conclude something is 'cleared' or legally permissible. Absence of a search hit is NOT proof of availability.\n"
    "- recommended_status must be one of RESEARCH_REQUIRED, REVIEW, or COUNSEL. Use COUNSEL when a real, "
    "rights-bearing entity is confirmed and the portrayal needs legal judgment.\n"
    "You are not a lawyer and do not decide legality."
)


class _Plan(BaseModel):
    objective: str
    queries: List[str] = Field(description="2-3 focused search queries")


class _Synthesis(BaseModel):
    entity_match_confidence: str = Field(description="HIGH | MEDIUM | LOW | NONE")
    evidence_strength: str = Field(description="HIGH | MEDIUM | LOW | NONE")
    established_facts: List[str]
    unresolved_questions: List[str]
    recommended_status: str = Field(description="RESEARCH_REQUIRED | REVIEW | COUNSEL")
    reason: str


class ResearchAgent:
    def __init__(self):
        self.model = gemini.model_name()

    async def plan_and_execute_research(
        self,
        case_id: str,
        entity_name: str,
        category: ClearanceCategory,
        scene_context: str,
    ) -> ResearchRun:
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        started = datetime.utcnow()

        # 1) Plan
        plan_prompt = (
            f"Clearance entity: {entity_name}\n"
            f"Category: {getattr(category, 'value', category)}\n"
            f"Scene context: {scene_context}\n\n"
            "Produce the research objective and queries. Return strict JSON."
        )
        plan: _Plan = await asyncio.to_thread(
            gemini.generate_structured, plan_prompt, _Plan, PLAN_SYSTEM
        )
        queries = [q for q in plan.queries if q][:3] or [f"{entity_name} trademark", f"{entity_name} brand company"]

        # 2) Live Parallel Search
        search = await parallel_search(objective=plan.objective, search_queries=queries, max_results=6)

        sources: List[EvidenceSource] = [
            EvidenceSource(
                id=item["id"],
                research_run_id=run_id,
                title=item["title"],
                url=item["url"],
                domain=item["domain"],
                excerpt=item["excerpt"],
                retrieved_at=datetime.utcnow(),
            )
            for item in search.get("results", [])
        ]

        # 3) Synthesize, grounded only in real sources
        if sources:
            evidence_block = "\n\n".join(
                f"[{i+1}] {s.title} ({s.domain})\nURL: {s.url}\n{s.excerpt}"
                for i, s in enumerate(sources)
            )
            synth_prompt = (
                f"Entity under review: {entity_name}\n"
                f"Scene context: {scene_context}\n\n"
                f"SOURCES (the only evidence you may use):\n{evidence_block}\n\n"
                "Synthesize the clearance picture. Return strict JSON."
            )
            synth: _Synthesis = await asyncio.to_thread(
                gemini.generate_structured, synth_prompt, _Synthesis, SYNTH_SYSTEM
            )
            recommended = synth.recommended_status if synth.recommended_status in _VALID_STATUS else CaseStatus.REVIEW.value
            synthesis = {
                "entity_match_confidence": synth.entity_match_confidence,
                "evidence_strength": synth.evidence_strength,
                "established_facts": synth.established_facts,
                "unresolved_questions": synth.unresolved_questions,
                "recommended_status": recommended,
                "reason": synth.reason,
                "executed_live": search.get("executed_live", False),
                "sources_count": len(sources),
                "disclaimer": DISCLAIMER,
            }
        else:
            synthesis = {
                "entity_match_confidence": "NONE",
                "evidence_strength": "NONE",
                "established_facts": [],
                "unresolved_questions": [
                    f"No web evidence was retrieved for '{entity_name}'. Manual research is required before any decision.",
                ],
                "recommended_status": CaseStatus.RESEARCH_REQUIRED.value,
                "reason": search.get("error") or "No sources returned by live search; cannot synthesize a grounded verdict.",
                "executed_live": False,
                "sources_count": 0,
                "disclaimer": DISCLAIMER,
            }

        return ResearchRun(
            id=run_id,
            case_id=case_id,
            objective=plan.objective,
            queries=queries,
            status="COMPLETED",
            started_at=started,
            completed_at=datetime.utcnow(),
            agent_run_id=f"agent-{uuid.uuid4().hex[:6]}",
            results=sources,
            synthesis=synthesis,
        )
