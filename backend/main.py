import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from api.routes import router

load_dotenv()

app = FastAPI(
    title="CLEARCUT Clearance Intelligence API",
    description="Stateful, revision-aware, multimodal clearance intelligence platform for film & TV.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Serve generated + committed production assets directly from the backend so image
# features work regardless of how the frontend is hosted. Same directory the asset
# routes read/write, so runtime-generated images are available immediately.
_ASSETS_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "assets"
_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/assets", StaticFiles(directory=str(_ASSETS_DIR)), name="assets")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
