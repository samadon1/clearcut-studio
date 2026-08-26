"""Seeded clearance team. Lightweight collaborators (no auth) so the workflow reads as
a real, multi-role clearance operation: coordinator, counsel, art, music, VFX.

Members are created in-app (no invite/login) so the roster can grow and elements can be
assigned to whoever fits — the foundation for role-based auto-assignment and persona switching."""

import re

TEAM = [
    {"id": "u-coord", "name": "Sarah Morandi", "role": "Clearance Coordinator", "initials": "SM", "color": "#c8a86a", "email": "sarah@studio.com", "you": True},
    {"id": "u-counsel", "name": "David Okafor", "role": "Entertainment Counsel", "initials": "DO", "color": "#d9646a", "email": "david.okafor@counsel.law"},
    {"id": "u-art", "name": "Elena Rostova", "role": "Art Director", "initials": "ER", "color": "#8291c4", "email": "elena@studio.com"},
    {"id": "u-music", "name": "Marcus Vance", "role": "Music Supervisor", "initials": "MV", "color": "#54c089", "email": "marcus@studio.com"},
    {"id": "u-vfx", "name": "Priya Nair", "role": "VFX Supervisor", "initials": "PN", "color": "#7c9cff", "email": "priya@studio.com"},
]

TEAM_BY_ID = {m["id"]: m for m in TEAM}
COUNSEL_ID = "u-counsel"
YOU_ID = "u-coord"


def default_assignee(category_value: str) -> str:
    c = (category_value or "").upper()
    if c == "MUSIC":
        return "u-music"
    if c in ("ARTWORK", "COPYRIGHT", "FOOTAGE_OR_ARCHIVAL_MEDIA"):
        return "u-art"
    if c in ("PERSON_OR_LIKENESS", "DEFAMATION_REVIEW"):
        return "u-counsel"
    return "u-coord"


def member_name(member_id: str) -> str:
    m = TEAM_BY_ID.get(member_id)
    return m["name"] if m else (member_id or "System")


# Avatar palette for newly added members (kept distinct from the seeded five).
_PALETTE = ["#c48fb0", "#6ac0c8", "#d19a5c", "#9c8cd8", "#7fb15a", "#e0925f", "#6fa8dc", "#c77d7d"]


def _initials(name: str) -> str:
    parts = [p for p in re.split(r"\s+", (name or "").strip()) if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def add_member(name: str, role: str) -> dict:
    """Create a new team member (no invite/login). Returns the created member."""
    name = (name or "").strip() or "New Member"
    role = (role or "").strip() or "Collaborator"
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:24] or f"m{len(TEAM)}"
    mid = f"u-{slug}"
    base, i = mid, 2
    while mid in TEAM_BY_ID:
        mid = f"{base}-{i}"
        i += 1
    member = {
        "id": mid, "name": name, "role": role,
        "initials": _initials(name),
        "color": _PALETTE[(len(TEAM) - 5) % len(_PALETTE)],
        "email": "",
    }
    TEAM.append(member)
    TEAM_BY_ID[mid] = member
    return member
