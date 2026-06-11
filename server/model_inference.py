from pathlib import Path
import shutil
import uuid
import json

# Import your notebook-converted functions here
# For now, place/copy your model code into this file:
# - load_detector
# - score_video
# - Config

MODEL_PATH = Path("/models/deepfake_detector.pt")
CALIBRATION_PATH = Path("/outputs/target_person_calibration.json")

cfg = Config()
model = load_detector(MODEL_PATH)


def analyze_uploaded_video(video_path: Path) -> dict:
    report = score_video(
        video_path=video_path,
        model=model,
        cfg=cfg,
        calibration_path=CALIBRATION_PATH,
    )

    return {
        "video": report["video"],
        "deepfake_probability": report["calibrated_result"]["deepfake_probability_0_100"],
        "confidence": report["calibrated_result"]["confidence"],
        "calibration_used": report["calibrated_result"]["calibration_used"],
        "raw_summary": report["raw_summary"],
        "top_suspicious_frames": report["top_suspicious_frames"],
    }