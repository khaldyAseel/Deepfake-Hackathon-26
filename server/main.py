import asyncio
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from deepfake_model import load_detector, score_video

ROOT_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = ROOT_DIR / "server" / "models" / "deepfake_detector.pt"
CALIBRATION_PATH = ROOT_DIR / "server" / "outputs" / "target_person_calibration.json"
WORK_DIR = ROOT_DIR / "runtime_work"

model = load_detector(MODEL_PATH)

from analysis import (
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

@app.post("/api/analyzev2")
async def analyze_video_v2(video: UploadFile = File(...)) -> dict:
    if not video.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    extension = Path(video.filename).suffix.lower()
    content_type = video.content_type or ""

    if extension not in ALLOWED_EXTENSIONS and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Upload MP4, MOV, WebM, or AVI.",
        )

    uploads_dir = ROOT_DIR / "tmp_uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}{extension}"
    video_path = uploads_dir / safe_name

    try:
        with video_path.open("wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        report = score_video(
            video_path=video_path,
            model=model,
            work_dir=WORK_DIR,
            calibration_path=CALIBRATION_PATH,
        )

        probability = report["calibrated_result"]["deepfake_probability_0_100"]

        score = round(100 - probability)

        if probability >= 70:
            category = "fake"
        elif probability >= 40:
            category = "suspicious"
        else:
            category = "live"

        return {
            "score": score,
            "category": category,
            "metrics": [
                {
                    "label": "Deepfake Risk",
                    "value": round(probability)
                },
                {
                    "label": "Realness Score",
                    "value": score
                },
                {
                    "label": "Frames Analyzed",
                    "value": min(
                        report["raw_summary"]["frames_analyzed"],
                        100
                    )
                },
                {
                    "label": "Max Fake Score",
                    "value": round(
                        report["raw_summary"]["max_fake_score"] * 100
                    )
                },
                {
                    "label": "Mean Fake Score",
                    "value": round(
                        report["raw_summary"]["mean_fake_score"] * 100
                    )
                }
            ]
        }

    finally:
        if video_path.exists():
            video_path.unlink()