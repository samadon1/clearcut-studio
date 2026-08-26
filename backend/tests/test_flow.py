import pytest
import asyncio
from agents.orchestrator import ClearanceOrchestrator
from models.schema import CaseStatus, ResolutionType, ArtifactType


def test_initial_baseline_state():
    orchestrator = ClearanceOrchestrator()
    summary = orchestrator.get_state_summary()
    
    assert summary["production"].title == "The Last Cup"
    assert summary["readiness"]["readiness_percent"] == 87
    assert summary["readiness"]["cleared"] == 221
    assert "C-137" in orchestrator.state["cases"]
    assert orchestrator.state["cases"]["C-137"].status == CaseStatus.CLEARED


def test_semantic_diff_and_invalidation():
    async def _run():
        orchestrator = ClearanceOrchestrator()
        analysis = await orchestrator.ingest_and_analyze_revision()

        # Verify hero metric: 19 changes detected, exactly 3 affect clearance
        assert analysis.total_changes_count == 19
        assert analysis.clearance_changes_count == 3
        assert "19 changes detected. Only 3 affect clearance." in analysis.hero_message

        # Verify invalidation of C-137
        c137 = orchestrator.state["cases"]["C-137"]
        assert c137.status == CaseStatus.REVIEW
        assert "fictionality" in c137.invalidated_reason.lower()

        # Verify creation of C-184 for Northstar Coffee
        assert "C-184" in orchestrator.state["cases"]
        c184 = orchestrator.state["cases"]["C-184"]
        assert c184.status == CaseStatus.COUNSEL
        assert "Northstar Coffee" in c184.summary

    asyncio.run(_run())


def test_parallel_research_synthesis():
    async def _run():
        orchestrator = ClearanceOrchestrator()
        await orchestrator.ingest_and_analyze_revision()

        research_run = await orchestrator.execute_case_research("C-184")
        assert research_run.status == "COMPLETED"
        assert len(research_run.results) > 0
        assert any("northstar" in r.title.lower() or "uspto" in r.domain.lower() for r in research_run.results)
        assert research_run.synthesis["entity_match_confidence"] == "HIGH"

    asyncio.run(_run())


def test_fictionalization_and_conflict_search():
    async def _run():
        orchestrator = ClearanceOrchestrator()
        await orchestrator.ingest_and_analyze_revision()

        candidate = await orchestrator.get_fictional_candidate("C-184")
        assert candidate.candidate_name == "Harbor Brew"
        assert candidate.conflict_found is False
        assert len(candidate.conflict_search_queries) >= 2
        assert "research aid" in candidate.disclaimer.lower()

    asyncio.run(_run())


def test_propagation_checker_signature_moment():
    async def _run():
        orchestrator = ClearanceOrchestrator()
        await orchestrator.ingest_and_analyze_revision()

        propagation = await orchestrator.approve_resolution(
            case_id="C-184",
            resolution_type=ResolutionType.FICTIONALIZE,
            replacement_value="Harbor Brew",
            approved_by="Studio Clearance Head"
        )

        # Assert signature phrase and downstream detection
        assert propagation.status == "INCOMPLETE"
        assert propagation.hero_message == "The script is fixed. The production isn't."
        
        # Check affected downstream artifacts
        affected_types = [item.artifact_type for item in propagation.items if item.current_status == "AFFECTED_OLD_ENTITY_PRESENT"]
        assert ArtifactType.STORYBOARD in affected_types
        assert ArtifactType.PROP_IMAGE in affected_types
        assert ArtifactType.FOOTAGE in affected_types

    asyncio.run(_run())
