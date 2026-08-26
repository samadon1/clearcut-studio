from datetime import datetime
from typing import Dict, Any, List
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
    ArtifactType,
    AuditEvent
)

def create_initial_seed_data() -> Dict[str, Any]:
    """
    Seeds initial project state: 'The Last Cup'
    - Current Script: Blue Draft v7
    - Overview: 243 tracked items (221 Cleared, 14 Review, 8 Counsel, 0 Blocked)
    - Key case: C-137 (Bean House) -> CLEARED (rationale: fictional business)
    - Downstream assets: Storyboard 42B, Prop P-018, Rough Cut 00:42:17
    """
    production = Production(
        id="prod-last-cup",
        title="The Last Cup",
        description="Feature film thriller / neo-noir production.",
        status="IN_PRODUCTION",
        created_at=datetime.utcnow()
    )

    artifacts = [
        Artifact(
            id="art-script-01",
            production_id="prod-last-cup",
            type=ArtifactType.SCRIPT,
            name="The Last Cup - Feature Screenplay",
            department="Screenwriting"
        ),
        Artifact(
            id="art-sb-01",
            production_id="prod-last-cup",
            type=ArtifactType.STORYBOARD,
            name="Storyboard Sequence 42 - Coffee Encounter",
            department="Art Department"
        ),
        Artifact(
            id="art-prop-01",
            production_id="prod-last-cup",
            type=ArtifactType.PROP_IMAGE,
            name="Prop Spec Sheet P-018 - Custom Coffee Cup",
            department="Props & Set Dressing"
        ),
        Artifact(
            id="art-ft-01",
            production_id="prod-last-cup",
            type=ArtifactType.FOOTAGE,
            name="Scene 42 Assembly Cut Master",
            department="Post-Production"
        ),
    ]

    artifact_versions = [
        ArtifactVersion(
            id="ver-script-v7",
            artifact_id="art-script-01",
            version_label="Blue Draft v7",
            mime_type="text/plain",
            checksum="sha256:7a8b9c0d1e2f3a4b",
            metadata={"total_scenes": 96, "pages": 118, "status": "LOCKED"}
        ),
        ArtifactVersion(
            id="ver-sb-42b",
            artifact_id="art-sb-01",
            version_label="Board 42B",
            mime_type="image/png",
            checksum="sha256:42b8a7f9e0c1d2e3",
            metadata={"frame": "42B", "description": "Maya and Julian in booth with neon coffee sign"}
        ),
        ArtifactVersion(
            id="ver-prop-p018",
            artifact_id="art-prop-01",
            version_label="Prop Spec v1",
            mime_type="image/jpeg",
            checksum="sha256:p018e4f5a6b7c8d9",
            metadata={"prop_code": "P-018", "type": "Hero Hand Prop"}
        ),
        ArtifactVersion(
            id="ver-ft-sc42",
            artifact_id="art-ft-01",
            version_label="Rough Cut v2",
            mime_type="video/mp4",
            checksum="sha256:ft42c1d2e3f4a5b6",
            metadata={"duration": "00:03:45", "timecode": "00:42:17"}
        ),
    ]

    entities = [
        ClearanceEntity(
            id="ent-bean-house",
            production_id="prod-last-cup",
            canonical_name="Bean House",
            entity_type=ClearanceCategory.BUSINESS_OR_ORGANIZATION,
            fictionality=Fictionality.FICTIONAL,
            aliases=["Bean House Cafe"],
            metadata={"creation_context": "Fictional run-down coffee shop invented for Scene 42 meeting."}
        ),
        ClearanceEntity(
            id="ent-abstract-art",
            production_id="prod-last-cup",
            canonical_name="Abstract Gallery Canvas",
            entity_type=ClearanceCategory.ARTWORK,
            fictionality=Fictionality.FICTIONAL,
            aliases=[],
            metadata={"creation_context": "In-house prop painting created by production art department."}
        ),
        ClearanceEntity(
            id="ent-metro-cab",
            production_id="prod-last-cup",
            canonical_name="Metro City Taxi",
            entity_type=ClearanceCategory.BUSINESS_OR_ORGANIZATION,
            fictionality=Fictionality.FICTIONAL,
            aliases=["Metro Cab"],
            metadata={"creation_context": "Fictional taxi livery."}
        ),
    ]

    cases = [
        ClearanceCase(
            id="C-137",
            production_id="prod-last-cup",
            entity_id="ent-bean-house",
            category=ClearanceCategory.BUSINESS_OR_ORGANIZATION,
            status=CaseStatus.CLEARED,
            priority="LOW",
            owner="Legal Clearance",
            summary="Bean House - Scene 42 Coffee Shop",
            assignee_id="u-coord",
            reason="Fictional business name created by art department. No commercial trademark conflict found.",
            unresolved_questions=[],
            established_facts=["Confirmed fictional entity.", "Prop department custom fabricated storefront sign."],
            confidence=0.98
        ),
        ClearanceCase(
            id="C-112",
            production_id="prod-last-cup",
            entity_id="ent-abstract-art",
            category=ClearanceCategory.ARTWORK,
            status=CaseStatus.CLEARED,
            priority="LOW",
            owner="Art Dept Clearance",
            summary="Abstract Gallery Painting - Scene 12",
            assignee_id="u-art",
            reason="Original artwork created by production staff; work-for-hire release executed.",
            unresolved_questions=[],
            established_facts=["Artist release signed."],
            confidence=1.0
        ),
        ClearanceCase(
            id="C-201",
            production_id="prod-last-cup",
            entity_id="ent-metro-cab",
            category=ClearanceCategory.LOCATION_OR_SIGNAGE,
            status=CaseStatus.REVIEW,
            priority="MEDIUM",
            owner="Locations Coordinator",
            summary="Metro City Taxi Livery - Exterior Chase",
            assignee_id="u-coord",
            reason="Verify taxi medallion numbering does not duplicate active municipal fleet.",
            unresolved_questions=["Confirm 4-digit medallion range is unassigned."],
            confidence=0.88
        ),
        ClearanceCase(
            id="C-208",
            production_id="prod-last-cup",
            entity_id="ent-bean-house",
            category=ClearanceCategory.MUSIC,
            status=CaseStatus.REVIEW,
            priority="MEDIUM",
            owner="Music Supervisor",
            summary="Background Radio Track - Diner Scene 4",
            assignee_id="u-music",
            reason="Source cue license pending master recording quote from publisher.",
            unresolved_questions=["Awaiting publisher synchronization quote."],
            confidence=0.85
        ),
    ]

    audit_events = [
        AuditEvent(
            id="aud-001",
            production_id="prod-last-cup",
            actor_type="SYSTEM",
            actor_id="CLEARCUT_CORE",
            event_type="PRODUCTION_INITIALIZED",
            entity_type="Production",
            entity_id="prod-last-cup",
            payload={"message": "Production 'The Last Cup' loaded with Blue Draft v7 baseline."}
        ),
        AuditEvent(
            id="aud-002",
            production_id="prod-last-cup",
            actor_type="HUMAN",
            actor_id="production_lawyer@studio.com",
            event_type="CASE_CLEARED",
            entity_type="ClearanceCase",
            entity_id="C-137",
            payload={"reason": "Marked Cleared based on fictionality."}
        )
    ]

    return {
        "production": production,
        "artifacts": artifacts,
        "artifact_versions": artifact_versions,
        "entities": entities,
        "cases": cases,
        "audit_events": audit_events,
        "readiness_totals": {
            "total_items": 243,
            "cleared": 221,
            "review": 14,
            "counsel": 8,
            "blocked": 0,
            "readiness_percent": 87,
            "departments": {
                "Script": 96,
                "Storyboard": 88,
                "Props": 82,
                "Footage": 94
            }
        }
    }
