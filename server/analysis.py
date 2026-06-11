from __future__ import annotations

import base64
import random
from pathlib import Path
from typing import Literal

METRIC_LABELS = [
    "Face consistency",
    "Blink behavior",
    "Head movement",
    "Audio-video sync",
    "Artifact risk",
]

ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
}

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi"}


def get_result_category(score: int) -> Literal["fake", "suspicious", "live"]:
    if score <= 30:
        return "fake"
    if score <= 60:
        return "suspicious"
    return "live"


def generate_mock_result() -> dict:
    score = random.randint(0, 100)
    category = get_result_category(score)

    metrics = []
    for label in METRIC_LABELS:
        variance = random.randint(-12, 12)
        value = max(0, min(100, score + variance))
        metrics.append({"label": label, "value": value, "icon": label})

    return {"score": score, "category": category, "metrics": metrics}


MAX_PROBLEMATIC_FRAMES = 3


def format_problematic_frames(
    top_frames: list[dict],
    limit: int = MAX_PROBLEMATIC_FRAMES,
) -> list[dict]:
    """Return up to `limit` suspicious frames as base64 data URLs for the frontend."""
    formatted: list[dict] = []

    for frame in top_frames:
        if len(formatted) >= limit:
            break

        image_path = Path(frame["image_path"])
        if not image_path.exists():
            continue

        encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
        formatted.append(
            {
                "frameIndex": int(frame.get("frame_number", len(formatted))),
                "fakeScore": round(float(frame["fake_score"]) * 100, 1),
                "timestampSeconds": round(float(frame["approx_second"]), 2),
                "imageUrl": f"data:image/jpeg;base64,{encoded}",
            }
        )

    return formatted
