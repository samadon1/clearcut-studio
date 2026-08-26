from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from models.schema import (
    ResolutionType,
    ArtifactType,
    CaseStatus
)
from agents.orchestrator import ClearanceOrchestrator
from collab import TEAM, TEAM_BY_ID, COUNSEL_ID, add_member

router = APIRouter(prefix="/api")
orchestrator = ClearanceOrchestrator()

_AGENT_LABELS = {
    "ARTIFACT_AGENT": "Artifact agent",
    "RESEARCH_AGENT": "Research agent",
    "RESOLUTION_AGENT": "Resolution agent",
    "IMPACT_ENGINE": "Impact engine",
    "CLEARCUT_CORE": "CLEARCUT",
    "CLEARCUT_ORCHESTRATOR": "CLEARCUT",
}


class AnalyzeRevisionRequest(BaseModel):
    from_version: str = "ver-script-v7"
    to_version_label: str = "Pink Draft v8"


class ApproveResolutionRequest(BaseModel):
    resolution_type: ResolutionType = ResolutionType.FICTIONALIZE
    replacement_value: str = "Harbor Brew"
    approved_by: str = "Clearance Coordinator"


class VisionAnalyzeRequest(BaseModel):
    artifact_type: ArtifactType = ArtifactType.STORYBOARD
    name: str = "Storyboard 42B"
    image_uri: Optional[str] = None


class RegenerateAssetRequest(BaseModel):
    asset_key: str = "storyboard"  # storyboard | prop | footage
    case_id: str = "C-184"


class CreateProjectRequest(BaseModel):
    title: str = "Untitled Production"
    script: str


class SwitchProjectRequest(BaseModel):
    id: str


class AddMemberRequest(BaseModel):
    name: str
    role: str = "Collaborator"


class GenerateAssetRequest(BaseModel):
    case_id: str
    kind: str = "storyboard"


class UploadAssetRequest(BaseModel):
    case_id: str
    kind: str = "storyboard"
    filename: str = "asset"
    image_base64: str


class FixAssetRequest(BaseModel):
    asset_id: str


@router.get("/health")
def health_check():
    return {"status": "ok", "app": "CLEARCUT", "mode": "production-ready"}


@router.get("/productions/summary")
def get_production_summary():
    return orchestrator.get_state_summary()


@router.post("/productions/reset")
def reset_to_seed():
    orchestrator.reset_to_seed()
    return {"message": "Production state reset to baseline (Blue Draft v7).", "summary": orchestrator.get_state_summary()}


@router.post("/productions/create")
async def create_project(req: CreateProjectRequest):
    if not req.script or not req.script.strip():
        raise HTTPException(status_code=400, detail="Script text is required")
    summary = await orchestrator.create_project_from_script(req.title, req.script)
    return {"message": "Clearance report generated.", "summary": summary}


@router.get("/projects")
def list_projects():
    return orchestrator.list_projects()


@router.post("/projects/switch")
def switch_project(req: SwitchProjectRequest):
    try:
        return {"summary": orchestrator.switch_project(req.id)}
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown project: {req.id}")


@router.post("/revisions/ingest")
async def ingest_revision(req: CreateProjectRequest):
    if not req.script or not req.script.strip():
        raise HTTPException(status_code=400, detail="Revised script text is required")
    summary = await orchestrator.ingest_custom_revision(req.script)
    return {"message": "Revision diffed against baseline.", "summary": summary}


@router.get("/script")
def get_script():
    st = orchestrator.state
    entities = st.get("entities", {})
    cases = list(st.get("cases", {}).values())
    case_by_entity = {c.entity_id: c for c in cases}
    items = []
    for m in st.get("mentions", {}).values():
        ent = entities.get(m.entity_id)
        c = case_by_entity.get(m.entity_id)
        items.append({
            "entity_id": m.entity_id,
            "name": ent.canonical_name if ent else "",
            "category": ent.entity_type.value if ent else "OTHER",
            "scene": m.scene,
            "quote": m.text_context,
            "case_id": c.id if c else None,
            "status": c.status.value if c else None,
        })
    return {
        "script_text": st.get("script_text"),
        "mentions": items,
        "is_custom": st.get("is_custom", False),
    }


@router.post("/revisions/analyze")
async def analyze_revision(req: AnalyzeRevisionRequest):
    result = await orchestrator.ingest_and_analyze_revision(
        from_version=req.from_version,
        to_version_label=req.to_version_label
    )
    return result


@router.get("/revisions/changes")
def get_revision_changes():
    analysis = orchestrator.state.get("latest_revision_analysis")
    if not analysis:
        # Return default preview if not yet triggered
        return {"total_changes_count": 0, "clearance_changes_count": 0, "changes": []}
    return analysis


@router.get("/cases")
def list_cases():
    return list(orchestrator.state["cases"].values())


@router.get("/cases/{case_id}")
def get_case(case_id: str):
    case = orchestrator.state["cases"].get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/cases/{case_id}/research")
async def execute_case_research(case_id: str):
    try:
        run = await orchestrator.execute_case_research(case_id)
        return run
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/cases/{case_id}/fictionalize/preview")
async def preview_fictional_candidate(case_id: str):
    try:
        candidate = await orchestrator.get_fictional_candidate(case_id)
        return candidate
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/cases/{case_id}/resolution/approve")
async def approve_resolution(case_id: str, req: ApproveResolutionRequest):
    try:
        propagation = await orchestrator.approve_resolution(
            case_id=case_id,
            resolution_type=req.resolution_type,
            replacement_value=req.replacement_value,
            approved_by=req.approved_by
        )
        return {
            "message": "Resolution approved and recorded.",
            "case": orchestrator.state["cases"][case_id],
            "propagation": propagation
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/cases/{case_id}/propagation-check")
async def check_propagation(case_id: str):
    case = orchestrator.state["cases"].get(case_id)
    replacement = case.resolution.replacement_value if case and case.resolution else "Harbor Brew"
    propagation = await orchestrator.resolution_agent.check_propagation(
        case_id=case_id,
        old_entity="Northstar Coffee",
        new_entity=replacement
    )
    return propagation


@router.post("/artifacts/vision-analyze")
async def vision_analyze(req: VisionAnalyzeRequest):
    image_bytes = None
    if req.image_uri and req.image_uri.startswith("data:"):
        import base64
        try:
            image_bytes = base64.b64decode(req.image_uri.split(",", 1)[1])
        except Exception:
            image_bytes = None
    result = await orchestrator.artifact_agent.analyze_visual_artifact(
        artifact_type=req.artifact_type,
        name=req.name,
        image_bytes=image_bytes,
    )
    return result


ASSET_SOURCES = {
    "storyboard": ("storyboard_42b.jpg", "image/jpeg", "black-and-white production storyboard sketch", "STORYBOARD"),
    "prop": ("prop_cup_p018.jpg", "image/jpeg", "prop design specification sheet showing a coffee cup", "PROP"),
    "footage": ("rough_cut_scene42.jpg", "image/jpeg", "cinematic film still", "FOOTAGE"),
}


@router.post("/assets/regenerate")
async def regenerate_asset(req: RegenerateAssetRequest):
    """Nano Banana: actually fix a production asset by rebranding it to the resolved name."""
    import asyncio
    from pathlib import Path
    from tools.image_edit import rebrand_image

    src = ASSET_SOURCES.get(req.asset_key)
    if not src:
        raise HTTPException(status_code=400, detail=f"Unknown asset_key '{req.asset_key}'")
    filename, mime, kind, type_token = src

    assets_dir = Path(__file__).resolve().parents[2] / "frontend" / "public" / "assets"
    fixed_dir = assets_dir / "fixed"
    fixed_dir.mkdir(parents=True, exist_ok=True)

    case = orchestrator.state["cases"].get(req.case_id)
    new_brand = "Arctura Coffee"
    if case and case.resolution and case.resolution.replacement_value:
        new_brand = case.resolution.replacement_value
    old_brand = "Northstar Coffee"
    out_name = f"{req.asset_key}_fixed.jpg"

    src_path = assets_dir / filename
    if not src_path.exists():
        raise HTTPException(status_code=404, detail=f"Source asset {filename} not found")

    try:
        # Live Nano Banana rebrand: it repaints the neon sign with the coined name.
        out = await asyncio.to_thread(rebrand_image, src_path.read_bytes(), mime, old_brand, new_brand, kind)
        # Nano Banana garbles the small slate + caption text, so we overlay those cleanly with
        # the real coined name. The sign stays fully live; the tiny text is always readable.
        if req.asset_key == "storyboard":
            from tools.image_edit import overlay_slate_caption
            out = await asyncio.to_thread(overlay_slate_caption, out, new_brand)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Image regeneration failed: {e}")

    (fixed_dir / out_name).write_bytes(out)

    # reflect in propagation state
    prop = orchestrator.state.get("latest_propagation")
    if prop:
        for it in prop.items:
            if type_token in it.artifact_type.value:
                it.current_status = "RESOLVED"

    return {"asset_key": req.asset_key, "url": f"/assets/fixed/{out_name}", "status": "RESOLVED", "new_brand": new_brand}


def _public_dir():
    from pathlib import Path
    return Path(__file__).resolve().parents[2] / "frontend" / "public"


def _case_mention(case):
    for m in orchestrator.state.get("mentions", {}).values():
        if m.entity_id == case.entity_id:
            return m
    return None


@router.get("/assets")
def list_case_assets(case_id: str):
    return [a for a in orchestrator.state.get("assets", {}).values() if a.get("case_id") == case_id]


@router.post("/assets/generate")
async def generate_case_asset(req: GenerateAssetRequest):
    import asyncio, uuid
    from tools.image_edit import generate_storyboard

    st = orchestrator.state
    case = st["cases"].get(req.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    ent = st["entities"].get(case.entity_id)
    entity_name = ent.canonical_name if ent else case.summary.split("—")[0].strip()
    m = _case_mention(case)
    scene = (m.scene if m else "") or case.summary
    excerpt = (m.text_context if m else "") or entity_name

    try:
        img = await asyncio.to_thread(generate_storyboard, scene, entity_name, case.category.value, excerpt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storyboard generation failed: {e}")

    gen_dir = _public_dir() / "assets" / "gen"
    gen_dir.mkdir(parents=True, exist_ok=True)
    aid = f"ast-{uuid.uuid4().hex[:8]}"
    (gen_dir / f"{aid}.jpg").write_bytes(img)
    asset = {
        "id": aid, "case_id": req.case_id, "kind": req.kind, "url": f"/assets/gen/{aid}.jpg",
        "status": "AFFECTED", "label": f"Storyboard · {scene.split(' - ')[0][:26]}",
        "detected": [entity_name], "department": "Art Dept · generated", "source": "generated",
    }
    st.setdefault("assets", {})[aid] = asset
    return asset


@router.post("/assets/upload")
async def upload_case_asset(req: UploadAssetRequest):
    import base64, uuid
    from models.schema import ArtifactType

    st = orchestrator.state
    case = st["cases"].get(req.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    b64 = req.image_base64.split(",", 1)[1] if req.image_base64.startswith("data:") else req.image_base64
    try:
        data = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")

    kind_map = {"storyboard": ArtifactType.STORYBOARD, "prop": ArtifactType.PROP_IMAGE,
                "footage": ArtifactType.FOOTAGE, "artwork": ArtifactType.ARTWORK}
    at = kind_map.get(req.kind, ArtifactType.OTHER)
    try:
        vision = await orchestrator.artifact_agent.analyze_visual_artifact(
            artifact_type=at, name=req.filename, image_bytes=data, mime_type="image/jpeg")
    except Exception:
        vision = {"detected_entities": [], "notes": ""}

    up_dir = _public_dir() / "assets" / "up"
    up_dir.mkdir(parents=True, exist_ok=True)
    aid = f"ast-{uuid.uuid4().hex[:8]}"
    (up_dir / f"{aid}.jpg").write_bytes(data)
    asset = {
        "id": aid, "case_id": req.case_id, "kind": req.kind, "url": f"/assets/up/{aid}.jpg",
        "status": "AFFECTED", "label": f"{req.kind.title()} · uploaded",
        "detected": vision.get("detected_entities", []), "department": "Uploaded",
        "notes": vision.get("notes", ""), "source": "uploaded",
    }
    st.setdefault("assets", {})[aid] = asset
    return asset


@router.post("/assets/fix")
async def fix_stored_asset(req: FixAssetRequest):
    import asyncio, uuid
    from tools.image_edit import rebrand_image

    st = orchestrator.state
    asset = st.get("assets", {}).get(req.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    case = st["cases"].get(asset["case_id"])
    ent = st["entities"].get(case.entity_id) if case else None
    old_brand = ent.canonical_name if ent else "the element"
    new_brand = case.resolution.replacement_value if case and case.resolution and case.resolution.replacement_value else None
    if not new_brand:
        raise HTTPException(status_code=400, detail="Resolve the case with a replacement first.")

    src = _public_dir() / asset["url"].lstrip("/")
    if not src.exists():
        raise HTTPException(status_code=404, detail="Asset file missing")
    try:
        out = await asyncio.to_thread(rebrand_image, src.read_bytes(), "image/jpeg", old_brand, new_brand, asset["kind"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Regeneration failed: {e}")

    fname = f"{req.asset_id}-fixed-{uuid.uuid4().hex[:4]}.jpg"
    (src.parent / fname).write_bytes(out)
    asset["url"] = f"{asset['url'].rsplit('/', 1)[0]}/{fname}"
    asset["status"] = "RESOLVED"
    asset["new_brand"] = new_brand
    return asset


@router.get("/deliverables/memo")
def get_clearance_memo():
    cases = list(orchestrator.state["cases"].values())
    analysis = orchestrator.state.get("latest_revision_analysis")
    return {
        "title": "CLEARCUT Revision Clearance Memo",
        "production": "The Last Cup",
        "date": "2026-08-25",
        "revision_compared": "Blue Draft v7 to Pink Draft v8",
        "hero_summary": (
            f"{analysis.total_changes_count} changes evaluated. "
            f"{analysis.clearance_changes_count} clearance-impacting modifications identified."
            if analysis else "No revision analyzed yet."
        ),
        "cases_status": [
            {
                "case_id": c.id,
                "summary": c.summary,
                "status": c.status.value,
                "category": c.category.value,
                "reason": c.reason,
                "resolution": c.resolution.replacement_value if c.resolution else "Pending Human Decision"
            }
            for c in cases
        ],
        "disclaimer": "This memo summarizes production clearance workflow records. It does not constitute legal advice."
    }


@router.get("/audit-log")
def get_audit_log():
    return orchestrator.state.get("audit_events", [])


@router.get("/team")
def get_team():
    return TEAM


@router.post("/team")
def create_team_member(req: AddMemberRequest):
    return add_member(req.name, req.role)


@router.post("/cases/{case_id}/refer-counsel")
def refer_to_counsel(case_id: str):
    import uuid
    from datetime import datetime
    from models.schema import AuditEvent
    case = orchestrator.state["cases"].get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.status = CaseStatus.COUNSEL
    case.assignee_id = COUNSEL_ID
    case.updated_at = datetime.utcnow()
    orchestrator.state["audit_events"].append(AuditEvent(
        id=f"aud-{uuid.uuid4().hex[:6]}", production_id=case.production_id, actor_type="HUMAN",
        actor_id="u-coord", event_type="CASE_ASSIGNED", entity_type="ClearanceCase", entity_id=case_id,
        payload={"to": COUNSEL_ID, "note": "Referred to entertainment counsel"}))
    return case


@router.post("/cases/{case_id}/assign")
def assign_case(case_id: str, assignee_id: str):
    import uuid
    from datetime import datetime
    from models.schema import AuditEvent
    case = orchestrator.state["cases"].get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.assignee_id = assignee_id
    case.updated_at = datetime.utcnow()
    orchestrator.state["audit_events"].append(AuditEvent(
        id=f"aud-{uuid.uuid4().hex[:6]}", production_id=case.production_id, actor_type="HUMAN",
        actor_id="u-coord", event_type="CASE_ASSIGNED", entity_type="ClearanceCase", entity_id=case_id,
        payload={"to": assignee_id}))
    return case


@router.get("/activity")
def get_activity():
    events = list(reversed(orchestrator.state.get("audit_events", [])))[:30]
    out = []
    for e in events:
        actor = TEAM_BY_ID.get(e.actor_id)
        ts = e.timestamp.isoformat() if hasattr(e.timestamp, "isoformat") else str(e.timestamp)
        out.append({
            "id": e.id, "event_type": e.event_type, "entity_type": e.entity_type, "entity_id": e.entity_id,
            "payload": e.payload, "timestamp": ts, "actor_type": e.actor_type, "actor_id": e.actor_id,
            "actor_name": actor["name"] if actor else (_AGENT_LABELS.get(e.actor_id) or (e.actor_id if e.actor_type == "HUMAN" else "System")),
            "actor_initials": actor["initials"] if actor else None,
            "actor_color": actor["color"] if actor else None,
        })
    return out


# ---------------- storyboard board ----------------

class BoardGenerateRequest(BaseModel):
    scene_index: int


def _parse_scenes(text: str):
    import re
    heading = re.compile(r"^\s*(SCENE\b.*|INT\.|EXT\.|EST\.|INT\./EXT\.|I/E\.)", re.I)
    scenes, cur = [], None
    for ln in (text or "").split("\n"):
        if ln.strip() and heading.match(ln):
            cur = {"heading": ln.strip(), "body": []}
            scenes.append(cur)
        elif cur is not None:
            cur["body"].append(ln)
    return [{"heading": s["heading"], "text": "\n".join(s["body"]).strip()} for s in scenes]


def _scene_flags(scene):
    entities = orchestrator.state.get("entities", {})
    hay = (scene["heading"] + " " + scene["text"]).lower()
    flags, seen = [], set()
    for c in orchestrator.state.get("cases", {}).values():
        ent = entities.get(c.entity_id)
        if ent and ent.canonical_name and ent.canonical_name.lower() in hay:
            key = ent.canonical_name.lower()
            if key in seen:
                continue
            seen.add(key)
            flags.append({"case_id": c.id, "name": ent.canonical_name, "category": c.category.value, "status": c.status.value})
    return flags


@router.get("/board")
def get_board():
    scenes = _parse_scenes(orchestrator.state.get("script_text") or "")
    board = orchestrator.state.get("board", {})
    out = []
    for i, sc in enumerate(scenes):
        frame = board.get(str(i))
        out.append({
            "index": i, "heading": sc["heading"], "snippet": sc["text"][:150],
            "flags": _scene_flags(sc),
            "frame_url": frame["url"] if frame else None,
            "status": frame["status"] if frame else None,
        })
    return {"scenes": out, "generated": sum(1 for s in out if s["frame_url"]), "total": len(out)}


async def _generate_frame(index: int, scenes):
    import asyncio, uuid
    from pathlib import Path
    from tools.image_edit import generate_storyboard
    sc = scenes[index]
    flags = _scene_flags(sc)
    entity = flags[0]["name"] if flags else ""
    category = flags[0]["category"] if flags else "OTHER"
    img = await asyncio.to_thread(generate_storyboard, sc["heading"], entity, category, sc["text"] or sc["heading"])
    d = _public_dir() / "assets" / "board"
    d.mkdir(parents=True, exist_ok=True)
    fname = f"scene-{index}-{uuid.uuid4().hex[:4]}.jpg"
    (d / fname).write_bytes(img)
    orchestrator.state.setdefault("board", {})[str(index)] = {"url": f"/assets/board/{fname}", "status": "GENERATED"}
    return orchestrator.state["board"][str(index)]


@router.post("/board/generate")
async def board_generate(req: BoardGenerateRequest):
    scenes = _parse_scenes(orchestrator.state.get("script_text") or "")
    if req.scene_index < 0 or req.scene_index >= len(scenes):
        raise HTTPException(status_code=400, detail="Invalid scene index")
    try:
        frame = await _generate_frame(req.scene_index, scenes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Frame generation failed: {e}")
    return {"index": req.scene_index, **frame}


@router.post("/board/generate-all")
async def board_generate_all():
    import asyncio
    scenes = _parse_scenes(orchestrator.state.get("script_text") or "")
    board = orchestrator.state.setdefault("board", {})
    todo = [i for i in range(len(scenes)) if str(i) not in board]
    sem = asyncio.Semaphore(4)

    async def bounded(i):
        async with sem:
            try:
                await _generate_frame(i, scenes)
            except Exception:
                pass
    await asyncio.gather(*[bounded(i) for i in todo])
    return get_board()
