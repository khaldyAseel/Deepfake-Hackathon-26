import asyncio
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from server.analysis import (
    ALLOWED_CONTENT_TYPES,
    ALLOWED_EXTENSIONS,
    generate_mock_result,
)

ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "dist"

app = FastAPI(
    title="LiveCheck AI",
    description="Demo API for video liveness / deepfake detection",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "livecheck-ai"}


@app.post("/api/analyze")
async def analyze_video(video: UploadFile = File(...)) -> dict:
    if not video.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    extension = Path(video.filename).suffix.lower()
    content_type = video.content_type or ""

    if extension not in ALLOWED_EXTENSIONS and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Upload MP4, MOV, WebM, or AVI.",
        )

    # Read upload so the request behaves like real processing; result is still mocked.
    await video.read()

    # Simulate model inference time
    await asyncio.sleep(2.5)

    return generate_mock_result()


if DIST_DIR.exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index() -> FileResponse:
        return FileResponse(DIST_DIR / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")

        candidate = DIST_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)

        return FileResponse(DIST_DIR / "index.html")
