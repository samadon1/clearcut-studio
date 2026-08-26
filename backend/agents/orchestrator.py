import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from models.schema import (
    Production,
    Artifact,
    ArtifactVersion,
    ClearanceEntity,
    Mention,
    ClearanceCase,
    CaseStatus,
    ClearanceCategory,
    Fictionality,
    AuditEvent,
    RevisionAnalysisResult,
    ResearchRun,
    Resolution,
    ResolutionType,
    PropagationCheckResult,
    PropagationItem,
    ArtifactType,
    FictionalCandidate
)
from data.seed import create_initial_seed_data
from collab import default_assignee, COUNSEL_ID, YOU_ID, member_name, TEAM, TEAM_BY_ID
from agents.artifact_agent import ArtifactAgent
from agents.research_agent import ResearchAgent
from agents.resolution_agent import ResolutionAgent


class ClearanceOrchestrator:
    """
    Clearance Orchestrator:
    Coordinates the deterministic state machine:
    INGEST -> EXTRACT -> COMPARE -> IMPACT -> PLAN_RESEARCH -> PARALLEL_SEARCH -> SYNTHESIZE -> HUMAN_REVIEW -> RESOLVE -> PROPAGATION_CHECK.
    """

    def __init__(self):
        self.artifact_agent = ArtifactAgent()
        self.research_agent = ResearchAgent()
        self.resolution_agent = ResolutionAgent()
        self.state: Dict[str, Any] = {}
        self.projects: Dict[str, Any] = {}
        self.active_id = None
        self.reset_to_seed()

    def _register(self, project_id: str):
        """Register the just-built self.state as a project and make it active."""
        self.projects[project_id] = self.state
        self.active_id = project_id

    def switch_project(self, project_id: str) -> Dict[str, Any]:
        if project_id not in self.projects:
            raise KeyError(project_id)
        self.state = self.projects[project_id]
        self.active_id = project_id
        return self.get_state_summary()

    def list_projects(self):
        out = []
        for pid, st in self.projects.items():
            cases = list(st.get("cases", {}).values())
            total = len(cases) or 1
            cleared = sum(1 for c in cases if c.status.value in ("CLEARED", "RESOLVED"))
            pct = round(cleared / total * 100) if st.get("is_custom") else st.get("readiness_totals", {}).get("readiness_percent", 87)
            out.append({
                "id": pid, "title": st["production"].title, "is_custom": st.get("is_custom", False),
                "elements": len(cases), "readiness": pct, "active": pid == self.active_id,
            })
        return out

    def reset_to_seed(self):
        """Initializes or resets the clearance state to baseline Blue Draft v7."""
        from pathlib import Path
        seed = create_initial_seed_data()
        data_dir = Path(__file__).resolve().parent.parent / "data"
        try:
            script_text = (data_dir / "blue_v7.txt").read_text(encoding="utf-8")
        except Exception:
            script_text = None
        mentions = {}
        for mid, eid, scene, quote in [
            ("men-d1", "ent-bean-house", "SCENE 42 - INT. BEAN HOUSE COFFEE SHOP - DAY", "BEAN HOUSE"),
            ("men-d2", "ent-abstract-art", "SCENE 12 - INT. RENWICK GALLERY - NIGHT", "abstract geometric canvas"),
        ]:
            mentions[mid] = Mention(id=mid, entity_id=eid, artifact_version_id="ver-script-v7",
                                    scene=scene, text_context=quote, confidence=1.0)
        self.state = {
            "production": seed["production"],
            "artifacts": {a.id: a for a in seed["artifacts"]},
            "artifact_versions": {v.id: v for v in seed["artifact_versions"]},
            "entities": {e.id: e for e in seed["entities"]},
            "cases": {c.id: c for c in seed["cases"]},
            "audit_events": list(seed["audit_events"]),
            "readiness_totals": dict(seed["readiness_totals"]),
            "latest_revision_analysis": None,
            "latest_propagation": None,
            "mentions": mentions,
            "is_custom": False,
            "script_text": script_text,
            "assets": {},
            "board": {},
        }
        self._register(self.state["production"].id)

    async def create_project_from_script(self, title: str, script_text: str) -> Dict[str, Any]:
        """Import a screenplay and produce a baseline Script Clearance Report (neg check)."""
        elements = await self.artifact_agent.breakdown_script(script_text, roster=list(TEAM))

        prod_id = f"prod-{uuid.uuid4().hex[:6]}"
        art_id = f"art-{uuid.uuid4().hex[:6]}"
        ver_id = f"ver-{uuid.uuid4().hex[:6]}"
        production = Production(id=prod_id, title=title or "Untitled Production",
                               description="Imported screenplay.", status="IN_PRODUCTION")
        artifact = Artifact(id=art_id, production_id=prod_id, type=ArtifactType.SCRIPT,
                            name=f"{title or 'Untitled'} — Screenplay", department="Screenwriting")
        version = ArtifactVersion(id=ver_id, artifact_id=art_id, version_label="Draft v1",
                                  mime_type="text/plain", raw_content=script_text, metadata={"baseline": True})

        valid_cats = {c.value for c in ClearanceCategory}
        valid_fict = {f.value for f in Fictionality}
        entities, cases, mentions, audit = {}, {}, {}, []
        n = 1
        for el in elements:
            cat = ClearanceCategory(el.category) if el.category in valid_cats else ClearanceCategory.OTHER
            fict = Fictionality(el.fictionality) if el.fictionality in valid_fict else Fictionality.UNKNOWN
            risk = (el.risk or "AMBER").upper()
            status = (CaseStatus.RESEARCH_REQUIRED if risk == "RED"
                      else CaseStatus.CLEARED if risk == "GREEN" else CaseStatus.REVIEW)
            priority = "HIGH" if risk == "RED" else ("LOW" if risk == "GREEN" else "MEDIUM")
            eid, cid, mid = f"ent-{n}", f"C-{n:03d}", f"men-{n}"
            entities[eid] = ClearanceEntity(id=eid, production_id=prod_id, canonical_name=el.name,
                                            entity_type=cat, fictionality=fict, metadata={"scene": el.scene})
            # Gemini picks the best-fit member by role; fall back to the deterministic mapping.
            assignee = el.assignee_id if el.assignee_id in TEAM_BY_ID else default_assignee(cat.value)
            cases[cid] = ClearanceCase(id=cid, production_id=prod_id, entity_id=eid, category=cat,
                                       status=status, priority=priority, owner="Clearance Coordinator",
                                       summary=f"{el.name} — {el.scene.split(' - ')[0].strip()}",
                                       reason=el.why, recommended_action=el.recommended_action,
                                       assignee_id=assignee, confidence=0.9)
            mentions[mid] = Mention(id=mid, entity_id=eid, artifact_version_id=ver_id, scene=el.scene,
                                    text_context=el.quote, confidence=0.9)
            n += 1

        total = len(cases) or 1
        cleared = sum(1 for c in cases.values() if c.status in (CaseStatus.CLEARED, CaseStatus.RESOLVED))
        review = sum(1 for c in cases.values() if c.status == CaseStatus.REVIEW)
        research = sum(1 for c in cases.values() if c.status == CaseStatus.RESEARCH_REQUIRED)
        pct = round(cleared / total * 100)
        audit.append(AuditEvent(id=f"aud-{uuid.uuid4().hex[:6]}", production_id=prod_id, actor_type="AGENT",
                                actor_id="ARTIFACT_AGENT", event_type="CLEARANCE_REPORT_GENERATED",
                                entity_type="ArtifactVersion", entity_id=ver_id,
                                payload={"elements": len(cases), "title": title}))

        self.state = {
            "production": production,
            "artifacts": {art_id: artifact},
            "artifact_versions": {ver_id: version},
            "entities": entities,
            "cases": cases,
            "mentions": mentions,
            "audit_events": audit,
            "readiness_totals": {"total_items": total, "cleared": cleared, "review": review,
                                 "counsel": research, "blocked": 0, "readiness_percent": pct,
                                 "departments": {"Script": pct, "Storyboard": 0, "Props": 0, "Footage": 0}},
            "latest_revision_analysis": None,
            "latest_propagation": None,
            "is_custom": True,
            "script_text": script_text,
            "baseline_version_id": ver_id,
            "assets": {},
            "board": {},
        }
        self._register(prod_id)
        return self.get_state_summary()

    async def ingest_custom_revision(self, new_script_text: str) -> Dict[str, Any]:
        """Diff a new draft against this project's imported baseline; surface what changed."""
        import re
        baseline = self.state.get("script_text") or ""
        # Re-ingesting the same draft (e.g. a second recording take, or a double click) must
        # not wipe the diff: the baseline already advanced to it, so a re-diff finds nothing.
        # Keep the existing revision analysis instead of clobbering it with an empty one.
        if new_script_text.strip() == baseline.strip() and self.state.get("latest_revision_analysis"):
            return self.get_state_summary()
        analysis = await self.artifact_agent.analyze_revision(
            from_version="Draft v1", to_version="Draft v2",
            old_content=baseline, content=new_script_text,
        )

        prod_id = self.state["production"].id
        art_id = next(iter(self.state["artifacts"]), "art-1")
        ver_id = f"ver-{uuid.uuid4().hex[:6]}"
        self.state["artifact_versions"][ver_id] = ArtifactVersion(
            id=ver_id, artifact_id=art_id, version_label="Draft v2",
            mime_type="text/plain", raw_content=new_script_text, metadata={"revision": True})

        nums = [int(m.group(1)) for cid in self.state["cases"] if (m := re.match(r"C-(\d+)$", cid))]
        n = (max(nums) + 1) if nums else 1

        revision_cases, new_mentions = [], {}
        for ch in analysis.changes:
            if not ch.clearance_impact:
                continue
            entity_name = ch.new_entities[0] if ch.new_entities else "Unspecified element"
            cat = ch.impact_categories[0] if ch.impact_categories else ClearanceCategory.OTHER
            eid, cid, mid = f"ent-r{n}", f"C-{n:03d}", f"men-r{n}"
            self.state["entities"][eid] = ClearanceEntity(
                id=eid, production_id=prod_id, canonical_name=entity_name, entity_type=cat,
                fictionality=Fictionality.UNKNOWN, metadata={"scene": ch.scene})

            prev_case_id = None
            for oe in ch.old_entities:
                for c in self.state["cases"].values():
                    ent = self.state["entities"].get(c.entity_id)
                    if ent and ent.canonical_name.lower() == oe.lower():
                        c.status = CaseStatus.REVIEW
                        c.invalidated_reason = f"Replaced in the new draft: {oe} → {entity_name}."
                        c.updated_at = datetime.utcnow()
                        prev_case_id = c.id

            case = ClearanceCase(
                id=cid, production_id=prod_id, entity_id=eid, category=cat,
                status=CaseStatus.RESEARCH_REQUIRED, priority="HIGH", owner="Clearance Coordinator",
                summary=f"{entity_name} — {ch.scene.split(' - ')[0].strip()}",
                reason=ch.explanation, created_from_change_id=ch.change_id,
                previous_case_id=prev_case_id, assignee_id=default_assignee(cat.value), confidence=ch.confidence)
            self.state["cases"][cid] = case
            revision_cases.append(case)

            quote = entity_name if entity_name.lower() in new_script_text.lower() else (ch.new_text[:80] or entity_name)
            new_mentions[mid] = Mention(id=mid, entity_id=eid, artifact_version_id=ver_id,
                                        scene=ch.scene, text_context=quote, confidence=0.9)
            n += 1

        analysis.affected_cases = revision_cases
        self.state["latest_revision_analysis"] = analysis
        self.state["script_text"] = new_script_text
        self.state["mentions"] = new_mentions
        self.state["audit_events"].append(AuditEvent(
            id=f"aud-{uuid.uuid4().hex[:6]}", production_id=prod_id, actor_type="AGENT",
            actor_id="ARTIFACT_AGENT", event_type="SCRIPT_REVISION_UPLOADED", entity_type="ArtifactVersion",
            entity_id=ver_id, payload={"changes_found": analysis.total_changes_count,
                                       "clearance_impacts": analysis.clearance_changes_count}))
        return self.get_state_summary()

    def get_state_summary(self) -> Dict[str, Any]:
        """Returns overall production status, readiness metrics, and urgent items."""
        cases_list = list(self.state["cases"].values())

        if self.state.get("is_custom"):
            total = len(cases_list) or 1
            cleared = sum(1 for c in cases_list if c.status in (CaseStatus.CLEARED, CaseStatus.RESOLVED))
            review = sum(1 for c in cases_list if c.status == CaseStatus.REVIEW)
            counsel = sum(1 for c in cases_list if c.status in (CaseStatus.COUNSEL, CaseStatus.RESEARCH_REQUIRED))
            blocked = sum(1 for c in cases_list if c.status == CaseStatus.BLOCKED)
            pct = round(cleared / total * 100)
            urgent_cases = [c for c in cases_list if c.status in (CaseStatus.COUNSEL, CaseStatus.REVIEW, CaseStatus.RESEARCH_REQUIRED)]
            urgent_cases.sort(key=lambda x: (x.status == CaseStatus.COUNSEL, x.priority == "URGENT", x.priority == "HIGH"), reverse=True)
            return {
                "production": self.state["production"],
                "readiness": {"total_items": total, "cleared": cleared, "review": review, "counsel": counsel,
                              "blocked": blocked, "readiness_percent": pct,
                              "departments": self.state["readiness_totals"].get("departments", {})},
                "latest_revision_analysis": self.state["latest_revision_analysis"],
                "urgent_cases": urgent_cases,
                "all_cases": cases_list,
                "audit_events": self.state["audit_events"][-10:],
                "is_custom": True,
            }

        # Scale against total 243 production tracked items
        base_cleared = 221
        base_review = 14
        base_counsel = 8
        base_blocked = 0

        # Adjust for dynamic cases
        has_v8 = self.state["latest_revision_analysis"] is not None
        if has_v8:
            is_c184_resolved = "C-184" in self.state["cases"] and self.state["cases"]["C-184"].status == CaseStatus.RESOLVED
            base_cleared = 222 if is_c184_resolved else 218
            base_review = 15
            base_counsel = 8 if is_c184_resolved else 9
            readiness_pct = 92 if is_c184_resolved else 84
        else:
            readiness_pct = 87

        urgent_cases = [c for c in cases_list if c.status in [CaseStatus.COUNSEL, CaseStatus.REVIEW, CaseStatus.RESEARCH_REQUIRED]]
        urgent_cases.sort(key=lambda x: (x.status == CaseStatus.COUNSEL, x.priority == "URGENT"), reverse=True)

        return {
            "production": self.state["production"],
            "readiness": {
                "total_items": 243,
                "cleared": base_cleared,
                "review": base_review,
                "counsel": base_counsel,
                "blocked": base_blocked,
                "readiness_percent": readiness_pct,
                "departments": {
                    "Script": 96 if not has_v8 else (92 if "C-184" in self.state["cases"] and self.state["cases"]["C-184"].status != CaseStatus.RESOLVED else 98),
                    "Storyboard": 88,
                    "Props": 82,
                    "Footage": 94
                }
            },
            "latest_revision_analysis": self.state["latest_revision_analysis"],
            "urgent_cases": urgent_cases,
            "all_cases": cases_list,
            "audit_events": self.state["audit_events"][-10:],
            "is_custom": self.state.get("is_custom", False)
        }

    async def ingest_and_analyze_revision(
        self,
        from_version: str = "ver-script-v7",
        to_version_label: str = "Pink Draft v8"
    ) -> RevisionAnalysisResult:
        """
        Step B: Upload & Analyze Revision
        - Extracts changes
        - Maps affected clearance cases
        - Invalidates C-137
        - Spawns C-184 (Northstar Coffee)
        """
        # Register new version
        new_version_id = "ver-script-v8"
        self.state["artifact_versions"][new_version_id] = ArtifactVersion(
            id=new_version_id,
            artifact_id="art-script-01",
            version_label=to_version_label,
            mime_type="text/plain",
            checksum="sha256:pink8v8f9e0c1d2e3",
            metadata={"total_scenes": 96, "pages": 118, "status": "REVISION_ANALYZED"}
        )

        analysis = await self.artifact_agent.analyze_revision(from_version, new_version_id)

        # Invalidate Case C-137 (Bean House)
        if "C-137" in self.state["cases"]:
            c137 = self.state["cases"]["C-137"]
            c137.status = CaseStatus.REVIEW
            c137.invalidated_reason = "Underlying entity replaced in Pink Draft v8: Bean House -> Northstar Coffee. Prior clearance relied on fictionality."
            c137.updated_at = datetime.utcnow()

        # Create new Entity and Case C-184 (Northstar Coffee)
        ent_northstar = ClearanceEntity(
            id="ent-northstar-coffee",
            production_id="prod-last-cup",
            canonical_name="Northstar Coffee",
            entity_type=ClearanceCategory.TRADEMARK,
            fictionality=Fictionality.REAL,
            aliases=["Northstar", "Northstar Coffee Roasters"],
            metadata={"source_scene": "42", "introduced_in": "Pink Draft v8"}
        )
        self.state["entities"][ent_northstar.id] = ent_northstar

        c184 = ClearanceCase(
            id="C-184",
            production_id="prod-last-cup",
            entity_id=ent_northstar.id,
            category=ClearanceCategory.TRADEMARK,
            status=CaseStatus.COUNSEL,
            priority="URGENT",
            owner="Entertainment Counsel / Clearance",
            summary="Northstar Coffee - Scene 42 Commercial Brand Depiction",
            reason="Replaces fictional Bean House in Pink Draft v8. Potentially real commercial brand and registered trademark depicted on hero cup prop.",
            created_from_change_id="chg-001",
            previous_case_id="C-137",
            assignee_id="u-coord",
            unresolved_questions=[
                "Confirm active commercial trademark registrations in Class 030 and Class 043.",
                "Assess whether portrayal in Scene 42 dialogue requires brand permission or fictionalization."
            ],
            established_facts=[
                "Scene 42 script specifically references 'Northstar Coffee' Ethiopian roast.",
                "Prop Department spec sheet P-018 calls for custom embossed logo cups."
            ],
            confidence=0.96
        )
        self.state["cases"][c184.id] = c184

        # Create a live case for every OTHER clearance-impacting change in this revision,
        # so the whole worklist is real (each item is researchable), not just Northstar.
        next_case_num = 185
        for ch in analysis.changes:
            if not ch.clearance_impact:
                continue
            is_northstar = (
                any("bean house" in e.lower() for e in ch.old_entities)
                or any("northstar" in e.lower() for e in ch.new_entities)
                or "northstar" in ch.new_text.lower()
            )
            if is_northstar:
                c184.created_from_change_id = ch.change_id
                continue
            entity_name = ch.new_entities[0] if ch.new_entities else "Unspecified element"
            cat = ch.impact_categories[0] if ch.impact_categories else ClearanceCategory.OTHER
            ent = ClearanceEntity(
                id=f"ent-{next_case_num}",
                production_id="prod-last-cup",
                canonical_name=entity_name,
                entity_type=cat,
                fictionality=Fictionality.UNKNOWN,
                metadata={"source_scene": ch.scene, "introduced_in": to_version_label},
            )
            self.state["entities"][ent.id] = ent
            new_case = ClearanceCase(
                id=f"C-{next_case_num}",
                production_id="prod-last-cup",
                entity_id=ent.id,
                category=cat,
                status=CaseStatus.RESEARCH_REQUIRED,
                priority="HIGH",
                owner="Clearance Coordinator",
                summary=f"{entity_name} — {ch.scene.split(' - ')[0].strip()}",
                reason=ch.explanation,
                created_from_change_id=ch.change_id,
                assignee_id=default_assignee(cat.value),
                confidence=ch.confidence,
            )
            self.state["cases"][new_case.id] = new_case
            next_case_num += 1

        # Add Audit Events
        self.state["audit_events"].append(
            AuditEvent(
                id=f"aud-{uuid.uuid4().hex[:6]}",
                production_id="prod-last-cup",
                actor_type="AGENT",
                actor_id="ARTIFACT_AGENT",
                event_type="SCRIPT_REVISION_UPLOADED",
                entity_type="ArtifactVersion",
                entity_id=new_version_id,
                payload={"version": to_version_label, "changes_found": analysis.total_changes_count, "clearance_impacts": analysis.clearance_changes_count}
            )
        )
        self.state["audit_events"].append(
            AuditEvent(
                id=f"aud-{uuid.uuid4().hex[:6]}",
                production_id="prod-last-cup",
                actor_type="AGENT",
                actor_id="IMPACT_ENGINE",
                event_type="CLEARANCE_CASE_INVALIDATED",
                entity_type="ClearanceCase",
                entity_id="C-137",
                payload={"reason": "Bean House replaced by Northstar Coffee."}
            )
        )

        # All cases created from a change in this revision, plus the invalidated C-137.
        revision_cases = [c for c in self.state["cases"].values() if c.created_from_change_id]
        analysis.affected_cases = revision_cases + [self.state["cases"]["C-137"]]
        self.state["latest_revision_analysis"] = analysis
        return analysis

    async def execute_case_research(self, case_id: str) -> ResearchRun:
        """Executes targeted research using Parallel Search for a given case."""
        case = self.state["cases"].get(case_id)
        if not case:
            raise ValueError(f"Case {case_id} not found.")

        entity = self.state["entities"].get(case.entity_id)
        entity_name = entity.canonical_name if entity else case.summary

        research_run = await self.research_agent.plan_and_execute_research(
            case_id=case_id,
            entity_name=entity_name,
            category=case.category,
            scene_context=case.summary
        )

        case.latest_research = research_run
        if research_run.synthesis:
            case.established_facts = research_run.synthesis.get("established_facts", case.established_facts)
            case.unresolved_questions = research_run.synthesis.get("unresolved_questions", case.unresolved_questions)
            case.reason = research_run.synthesis.get("reason", case.reason)
            # Research actually moves the case: apply the grounded recommendation.
            rec = research_run.synthesis.get("recommended_status")
            valid = {s.value for s in CaseStatus}
            if rec in valid and case.status != CaseStatus.RESOLVED:
                case.status = CaseStatus(rec)
            case.updated_at = datetime.utcnow()

        self.state["audit_events"].append(
            AuditEvent(
                id=f"aud-{uuid.uuid4().hex[:6]}",
                production_id="prod-last-cup",
                actor_type="AGENT",
                actor_id="RESEARCH_AGENT",
                event_type="PARALLEL_SEARCH_EXECUTED",
                entity_type="ResearchRun",
                entity_id=research_run.id,
                payload={
                    "case_id": case_id,
                    "queries": research_run.queries,
                    "results_count": len(research_run.results)
                }
            )
        )
        return research_run

    async def get_fictional_candidate(self, case_id: str) -> FictionalCandidate:
        """Runs the fictionalization candidate generator & Parallel conflict check loop."""
        case = self.state["cases"].get(case_id)
        entity = self.state["entities"].get(case.entity_id) if case else None
        entity_name = entity.canonical_name if entity else (case.summary if case else "Northstar Coffee")
        category = entity.entity_type.value if entity else "brand"
        candidate = await self.resolution_agent.propose_fictionalization(
            original_entity=entity_name,
            category=category,
            context=case.summary if case else None,
        )
        return candidate

    async def approve_resolution(
        self,
        case_id: str,
        resolution_type: ResolutionType,
        replacement_value: str = "Harbor Brew",
        approved_by: str = "Production Clearance Supervisor"
    ) -> PropagationCheckResult:
        """
        Applies human-approved resolution and runs the Propagation Checker.
        Returns: PropagationCheckResult ("The script is fixed. The production isn't.")
        """
        case = self.state["cases"].get(case_id)
        if not case:
            raise ValueError(f"Case {case_id} not found.")

        resolution = Resolution(
            id=f"res-{uuid.uuid4().hex[:6]}",
            case_id=case_id,
            resolution_type=resolution_type,
            proposed_by="CLEARCUT_AI",
            approved_by=approved_by,
            replacement_value=replacement_value,
            notes=f"Resolved with candidate '{replacement_value}'. Live Parallel conflict search cleared candidate.",
            created_at=datetime.utcnow()
        )
        case.resolution = resolution
        case.status = CaseStatus.RESOLVED
        case.updated_at = datetime.utcnow()

        self.state["audit_events"].append(
            AuditEvent(
                id=f"aud-{uuid.uuid4().hex[:6]}",
                production_id="prod-last-cup",
                actor_type="HUMAN",
                actor_id=approved_by,
                event_type="RESOLUTION_APPROVED",
                entity_type="ClearanceCase",
                entity_id=case_id,
                payload={
                    "type": resolution_type.value,
                    "replacement": replacement_value
                }
            )
        )

        # Run Propagation Check. Only the Northstar case has downstream physical/visual
        # assets in the demo; other elements (artwork, music) live only in the script.
        entity = self.state["entities"].get(case.entity_id)
        old_entity = entity.canonical_name if entity else "Northstar Coffee"
        if "northstar" in old_entity.lower():
            propagation = await self.resolution_agent.check_propagation(
                case_id=case_id, old_entity=old_entity, new_entity=replacement_value or "the fictional element"
            )
        else:
            propagation = PropagationCheckResult(
                case_id=case_id,
                resolved_entity_name=old_entity,
                replacement_name=replacement_value or "—",
                status="COMPLETE",
                hero_message="No downstream physical or visual assets reference this element.",
                items=[PropagationItem(
                    artifact_type=ArtifactType.SCRIPT,
                    artifact_id="art-script-01",
                    artifact_name="The Last Cup - Screenplay",
                    version_label="Pink Draft v8",
                    location=case.summary,
                    current_status="RESOLVED",
                    snippet_or_label=f"Resolved: {resolution_type.value.replace('_', ' ').lower()}",
                    department="Screenwriting / Legal",
                    recommended_task="Disposition recorded in clearance log.",
                )],
                tasks_created=False,
            )
        self.state["latest_propagation"] = propagation

        self.state["audit_events"].append(
            AuditEvent(
                id=f"aud-{uuid.uuid4().hex[:6]}",
                production_id="prod-last-cup",
                actor_type="AGENT",
                actor_id="RESOLUTION_AGENT",
                event_type="PROPAGATION_CHECK_COMPLETED",
                entity_type="PropagationCheckResult",
                entity_id=case_id,
                payload={
                    "status": propagation.status,
                    "affected_downstream_count": sum(1 for i in propagation.items if i.current_status != "RESOLVED")
                }
            )
        )
        return propagation
