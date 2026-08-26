"""
Regenerate CLEARCUT demo production assets with Gemini (Nano Banana, gemini-2.5-flash-image).

These are the props/storyboard/footage for the fictional production "The Last Cup".
They must consistently show the in-world brand NORTHSTAR COFFEE and characters MAYA & JULIAN,
Scene 42, because the propagation demo depends on the old brand being visibly present.

Run:  PYTHONPATH=. ./venv/bin/python scripts/generate_assets.py
Writes to ../frontend/public/assets/*.jpg
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from google import genai
from google.genai import types

OUT = Path(__file__).resolve().parents[2] / "frontend" / "public" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

MODEL = "gemini-2.5-flash-image"
client = genai.Client(vertexai=True, project=os.environ["GOOGLE_CLOUD_PROJECT"], location="us-central1")

ASSETS = {
    "storyboard_42b.jpg": (
        "A black-and-white cinematic production storyboard panel, hand-drawn pencil and charcoal "
        "style, 16:9, with a clean frame border. INT. NORTHSTAR COFFEE - DAY. Two characters sit "
        "across a sleek table in an upscale specialty coffee shop: MAYA, a woman in her 30s in a "
        "designer trench coat, and JULIAN, a man in his 40s in a tailored suit. Rain streaks the "
        "floor-to-ceiling windows behind them, with car headlight streaks outside. On the back wall, "
        "a glowing neon sign clearly reads 'NORTHSTAR COFFEE' with a small north-star and coffee-cup "
        "icon. A hero paper coffee cup sits on the table. Bottom caption bar in bold: "
        "'SCENE 42  |  INT. NORTHSTAR COFFEE - DAY  |  MAYA & JULIAN'."
    ),
    "prop_cup_p018.jpg": (
        "A film production PROP DESIGN SPECIFICATION SHEET on a clean off-white studio background, "
        "professional and precise, 16:9. Title bar: 'FILM PRODUCTION PROP DESIGN SPECIFICATION SHEET'. "
        "SUBJECT: CUSTOM TAKEAWAY COFFEE CUP ('NORTHSTAR COFFEE'). Show an embossed kraft-paper coffee "
        "cup and sleeve with a circular badge logo that clearly reads 'NORTHSTAR COFFEE' with a north-star "
        "icon and 'EST. 2019'. Include dimension callouts (cup height, top and base diameter), a small "
        "column of Pantone colour chips, and a red rubber-stamp box in the lower right reading 'PROP DEPT. "
        "INVENTORY', DATE, APPROVED, ITEM ID: P-018, PRODUCTION: 'THE LAST CUP', QUANTITY: 100 UNITS. "
        "Top-right code: SPEC-CUP-P018. Notes line: 'To be used in Scene 42 (NORTHSTAR COFFEE interior).'"
    ),
    "rough_cut_scene42.jpg": (
        "A photorealistic cinematic film still, 16:9, moody neo-noir lighting with shallow depth of field. "
        "Medium close-up inside an upscale coffee shop: a man's hand (JULIAN, tailored suit cuff) setting an "
        "embossed kraft paper coffee cup down on a polished walnut table. The cup clearly shows a circular "
        "'NORTHSTAR COFFEE' logo with a north-star icon. Behind, out-of-focus rain-streaked windows with warm "
        "bokeh. A small unobtrusive white timecode overlay in the lower-right corner reads '00:42:17'. "
        "Film-grain, anamorphic look."
    ),
}


def extract_image_bytes(resp):
    for cand in resp.candidates or []:
        for part in cand.content.parts or []:
            data = getattr(part, "inline_data", None)
            if data and data.data:
                return data.data
    return None


def main():
    for filename, prompt in ASSETS.items():
        print(f"Generating {filename} ...")
        resp = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
        )
        img = extract_image_bytes(resp)
        if not img:
            print(f"  !! no image returned for {filename}")
            continue
        (OUT / filename).write_bytes(img)
        print(f"  -> wrote {OUT / filename}  ({len(img)//1024} KB)")


if __name__ == "__main__":
    main()
