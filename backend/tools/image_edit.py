"""
Nano Banana (gemini-2.5-flash-image) image editing.

Used to actually "fix the production": take a real production asset (storyboard, prop,
footage still) that still shows the old brand and regenerate it with the approved
fictional brand, preserving composition, characters, and style.

Image models live in a region (not 'global'), so this uses a us-central1 client.
"""
import os
from typing import Optional
from google import genai
from google.genai import types

_client = None
MODEL = "gemini-2.5-flash-image"


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(
            vertexai=True,
            project=os.environ["GOOGLE_CLOUD_PROJECT"],
            location=os.environ.get("IMAGE_LOCATION", "us-central1"),
        )
    return _client


def _extract_image(resp) -> Optional[bytes]:
    for cand in resp.candidates or []:
        for part in (cand.content.parts if cand.content else []) or []:
            data = getattr(part, "inline_data", None)
            if data and data.data:
                return data.data
    return None


def rebrand_image(image_bytes: bytes, mime_type: str, old_brand: str, new_brand: str, kind: str) -> bytes:
    """Return new image bytes with old_brand replaced by new_brand, everything else identical."""
    prompt = (
        f"This is a {kind} from a film production. Scan the ENTIRE frame edge to edge and read every "
        f"readable word, then replace EVERY instance of '{old_brand}' with the fictional brand "
        f"'{new_brand}'. Check ALL of these regions and fix each one that names the brand:\n"
        f"1) the main logo / sign / neon in the scene,\n"
        f"2) packaging, cups, props, labels,\n"
        f"3) the top header slate or title text,\n"
        f"4) the BOTTOM caption / metadata strip that describes the scene (this is the one most often "
        f"missed — it must be updated too).\n"
        f"CRITICAL: after the edit, the exact string '{old_brand}' must not remain anywhere in the image, "
        f"including small caption text. Every occurrence becomes '{new_brand}', matching the original font, "
        f"size, colour and placement. Keep the composition, characters, framing, lighting, art style and "
        f"camera angle EXACTLY the same. Only the brand wording changes."
    )
    resp = _get_client().models.generate_content(
        model=MODEL,
        contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type), prompt],
        config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
    )
    out = _extract_image(resp)
    if not out:
        raise RuntimeError("Nano Banana returned no image.")
    return out


def _font(size: int):
    from PIL import ImageFont
    for p in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",         # macOS (local dev)
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",      # Linux container
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def overlay_slate_caption(image_bytes: bytes, new_brand: str) -> bytes:
    """Nano Banana rebrands the neon sign well but garbles the small slate/caption text.
    So we repaint the top slate and bottom caption bars with clean text using the real
    coined name. Positions are the crafted storyboard's known bars, scaled to the image."""
    import io
    from PIL import Image, ImageDraw
    im = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    W, H = im.size
    sx, sy = W / 1024.0, H / 1024.0
    d = ImageDraw.Draw(im)
    brand = (new_brand or "").strip().upper()
    ink = (235, 235, 235)
    bar = (8, 8, 8)
    # top slate bar (source y ~22..76)
    d.rectangle([0, int(20 * sy), W, int(80 * sy)], fill=bar)
    d.text((int(58 * sx), int(34 * sy)), f"INT. {brand} - DAY", font=_font(int(30 * sy)), fill=ink)
    # bottom caption bar (source y ~950..1004)
    d.rectangle([0, int(946 * sy), W, int(1008 * sy)], fill=bar)
    cap = f"SCENE 42     |     INT. {brand} - DAY     |     MAYA & JULIAN"
    size = int(28 * sy)
    while size > 14 and d.textlength(cap, font=_font(size)) > W - int(100 * sx):
        size -= 1
    d.text((int(58 * sx), int(962 * sy)), cap, font=_font(size), fill=ink)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def generate_storyboard(scene: str, entity: str, category: str, excerpt: str) -> bytes:
    """Generate a storyboard frame for a scene, visibly featuring the clearance entity (if any)."""
    feature = (
        f"The frame must visibly feature '{entity}' (a {category.replace('_', ' ').lower()}) — show it "
        "clearly as signage, a logo, a product, an artwork on the wall, or an on-screen element as "
        "appropriate. "
        if entity else ""
    )
    prompt = (
        "A black-and-white cinematic production storyboard sketch, hand-drawn pencil and charcoal "
        "style, 16:9, with a clean frame border and a small caption bar at the bottom. "
        f"Scene: {scene}. "
        f"{feature}"
        f"Scene context: {excerpt[:400]}. "
        "Storyboard illustration only, not photorealistic. No modern UI, no watermarks."
    )
    resp = _get_client().models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
    )
    out = _extract_image(resp)
    if not out:
        raise RuntimeError("Nano Banana returned no image.")
    return out
