import random
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
