from pathlib import Path
from typing import Dict, List, Optional, Tuple
import math
import json

import cv2
import numpy as np
import pandas as pd
from PIL import Image

import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

import subprocess
import tempfile
import librosa


DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class Config:
    fps_sample = 2.0
    max_frames_per_video = 300
    face_size = 224
    face_margin = 0.25
    suspicious_top_percent = 0.10


class EfficientNetDeepfakeDetector(nn.Module):
    def __init__(self, pretrained: bool = True):
        super().__init__()
        weights = EfficientNet_B0_Weights.DEFAULT if pretrained else None
        self.backbone = efficientnet_b0(weights=weights)

        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True),
            nn.Linear(in_features, 1),
        )

    def forward(self, x):
        return self.backbone(x).squeeze(1)


cfg = Config()

transform = transforms.Compose([
    transforms.Resize((cfg.face_size, cfg.face_size)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def load_detector(checkpoint_path: str | Path) -> nn.Module:
    model = EfficientNetDeepfakeDetector(pretrained=True).to(DEVICE)

    checkpoint_path = Path(checkpoint_path)
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Model checkpoint not found: {checkpoint_path}")

    ckpt = torch.load(checkpoint_path, map_location=DEVICE)

    if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        state = ckpt["model_state_dict"]
    else:
        state = ckpt

    model.load_state_dict(state, strict=False)
    model.eval()
    return model


HAAR_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_detector = cv2.CascadeClassifier(HAAR_PATH)


def sample_video_frames(
    video_path: str | Path,
    output_dir: str | Path,
    fps_sample: float = 2.0,
    max_frames: int = 300,
) -> List[Path]:
    video_path = Path(video_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")

    source_fps = cap.get(cv2.CAP_PROP_FPS)
    if source_fps <= 0:
        source_fps = 25

    step = max(1, int(round(source_fps / fps_sample)))

    saved_paths = []
    frame_idx = 0
    saved_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % step == 0:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            out_path = output_dir / f"{video_path.stem}_frame_{saved_idx:05d}.jpg"
            Image.fromarray(frame_rgb).save(out_path, quality=95)
            saved_paths.append(out_path)
            saved_idx += 1

            if saved_idx >= max_frames:
                break

        frame_idx += 1

    cap.release()
    return saved_paths


def detect_largest_face(image_rgb: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)

    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(50, 50),
    )

    if len(faces) == 0:
        return None

    faces = sorted(faces, key=lambda box: box[2] * box[3], reverse=True)
    x, y, w, h = faces[0]
    return int(x), int(y), int(w), int(h)


def crop_face(
    image_path: str | Path,
    output_path: str | Path,
    face_size: int = 224,
    margin: float = 0.25,
) -> bool:
    image_path = Path(image_path)
    output_path = Path(output_path)

    img = np.array(Image.open(image_path).convert("RGB"))
    h_img, w_img = img.shape[:2]

    box = detect_largest_face(img)
    if box is None:
        return False

    x, y, w, h = box

    mx = int(w * margin)
    my = int(h * margin)

    x1 = max(0, x - mx)
    y1 = max(0, y - my)
    x2 = min(w_img, x + w + mx)
    y2 = min(h_img, y + h + my)

    crop = img[y1:y2, x1:x2]
    crop = Image.fromarray(crop).resize((face_size, face_size))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    crop.save(output_path, quality=95)

    return True


def crop_faces_from_frames(
    frame_paths: List[Path],
    output_dir: str | Path,
    face_size: int = 224,
    margin: float = 0.25,
) -> List[Path]:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    crop_paths = []

    for frame_path in frame_paths:
        out_path = output_dir / frame_path.name
        ok = crop_face(
            image_path=frame_path,
            output_path=out_path,
            face_size=face_size,
            margin=margin,
        )

        if ok:
            crop_paths.append(out_path)

    return crop_paths

def extract_audio_from_video(video_path: Path, output_wav: Path) -> bool:
    command = [
        "ffmpeg",
        "-y",
        "-i", str(video_path),
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        str(output_wav),
    ]

    result = subprocess.run(
        command,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return result.returncode == 0 and output_wav.exists()


def analyze_audio(video_path: str | Path) -> dict:
    video_path = Path(video_path)

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = Path(tmpdir) / "audio.wav"

        has_audio = extract_audio_from_video(video_path, audio_path)

        if not has_audio:
            return {
                "has_audio": False,
                "audio_score": 50,
                "audio_flags": ["No audio track detected"],
            }

        y, sr = librosa.load(audio_path, sr=16000)

        if len(y) == 0:
            return {
                "has_audio": False,
                "audio_score": 50,
                "audio_flags": ["Empty audio track"],
            }

        rms = librosa.feature.rms(y=y)[0]
        silence_ratio = float(np.mean(rms < 0.01))

        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        zero_crossing_rate = librosa.feature.zero_crossing_rate(y)[0]

        rms_mean = float(np.mean(rms))
        rms_std = float(np.std(rms))
        centroid_mean = float(np.mean(spectral_centroid))
        bandwidth_mean = float(np.mean(spectral_bandwidth))
        zcr_mean = float(np.mean(zero_crossing_rate))

        flags = []
        audio_score = 0

        if silence_ratio > 0.55:
            audio_score += 25
            flags.append("High silence ratio")

        if rms_std < 0.005:
            audio_score += 20
            flags.append("Very flat volume dynamics")

        if centroid_mean > 3500:
            audio_score += 20
            flags.append("Unusually sharp/high-frequency audio")

        if bandwidth_mean < 800:
            audio_score += 15
            flags.append("Narrow audio bandwidth")

        if zcr_mean > 0.20:
            audio_score += 20
            flags.append("Noisy or unstable waveform")

        audio_score = min(audio_score, 100)

        if not flags:
            flags.append("No obvious basic audio anomaly detected")

        return {
            "has_audio": True,
            "audio_score": round(audio_score, 2),
            "audio_flags": flags,
            "audio_features": {
                "rms_mean": rms_mean,
                "rms_std": rms_std,
                "silence_ratio": silence_ratio,
                "spectral_centroid_mean": centroid_mean,
                "spectral_bandwidth_mean": bandwidth_mean,
                "zero_crossing_rate_mean": zcr_mean,
            },
        }


@torch.no_grad()
def predict_face_batch(
    model: nn.Module,
    image_paths: List[Path],
    batch_size: int = 32,
) -> pd.DataFrame:
    rows = []

    for i in range(0, len(image_paths), batch_size):
        batch_paths = image_paths[i:i + batch_size]

        imgs = [
            transform(Image.open(path).convert("RGB"))
            for path in batch_paths
        ]

        x = torch.stack(imgs).to(DEVICE)
        logits = model(x)
        probs = torch.sigmoid(logits).detach().cpu().numpy()

        for path, score in zip(batch_paths, probs):
            rows.append({
                "image_path": str(path),
                "fake_score": float(score),
            })

    return pd.DataFrame(rows)


def analyze_video(
    video_path: str | Path,
    model: nn.Module,
    work_dir: str | Path,
) -> pd.DataFrame:
    video_path = Path(video_path)
    work_dir = Path(work_dir)

    frames_dir = work_dir / "frames" / video_path.stem
    crops_dir = work_dir / "crops" / video_path.stem

    frame_paths = sample_video_frames(
        video_path=video_path,
        output_dir=frames_dir,
        fps_sample=cfg.fps_sample,
        max_frames=cfg.max_frames_per_video,
    )

    crop_paths = crop_faces_from_frames(
        frame_paths=frame_paths,
        output_dir=crops_dir,
        face_size=cfg.face_size,
        margin=cfg.face_margin,
    )

    if len(crop_paths) == 0:
        raise ValueError("No faces detected in sampled frames.")

    scores_df = predict_face_batch(model, crop_paths)
    scores_df["video"] = video_path.name
    scores_df["frame_number"] = range(len(scores_df))

    return scores_df


def aggregate_video_score(scores_df: pd.DataFrame) -> Dict:
    scores = scores_df["fake_score"].values.astype(float)

    if len(scores) == 0:
        raise ValueError("No scores to aggregate.")

    k = max(1, int(math.ceil(len(scores) * cfg.suspicious_top_percent)))
    top_scores = np.sort(scores)[-k:]

    mean_score = float(np.mean(scores))
    median_score = float(np.median(scores))
    top_mean_score = float(np.mean(top_scores))
    max_score = float(np.max(scores))

    final_score = 0.55 * mean_score + 0.35 * top_mean_score + 0.10 * max_score

    return {
        "frames_analyzed": int(len(scores)),
        "mean_fake_score": mean_score,
        "median_fake_score": median_score,
        "top_percent_mean_fake_score": top_mean_score,
        "max_fake_score": max_score,
        "raw_final_score_0_1": float(final_score),
        "raw_final_score_0_100": round(float(final_score * 100), 2),
    }


def load_calibration(calibration_path: str | Path) -> Optional[Dict]:
    calibration_path = Path(calibration_path)

    if not calibration_path.exists():
        return None

    with calibration_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def calibrated_risk_score(raw_score_0_1: float, calibration: Optional[Dict]) -> Dict:
    if calibration is None:
        return {
            "deepfake_probability_0_100": round(raw_score_0_1 * 100, 2),
            "calibration_used": False,
            "confidence": "low",
            "note": "No target-person calibration was used.",
        }

    real_mean = calibration["real_mean_score"]
    real_std = max(calibration["real_std_score"], 1e-6)
    real_p95 = calibration["real_p95_score"]

    z = (raw_score_0_1 - real_mean) / real_std

    if raw_score_0_1 <= real_p95:
        calibrated = raw_score_0_1 * 0.65
    else:
        excess = raw_score_0_1 - real_p95
        calibrated = real_p95 * 0.65 + excess * 1.35

    calibrated = float(np.clip(calibrated, 0, 1))

    if z < 1.0:
        confidence = "low"
    elif z < 2.0:
        confidence = "medium"
    else:
        confidence = "high"

    return {
        "deepfake_probability_0_100": round(calibrated * 100, 2),
        "calibration_used": True,
        "z_score_vs_real_target": round(float(z), 3),
        "target_real_p95": round(float(real_p95), 4),
        "confidence": confidence,
    }


def score_video(
    video_path: str | Path,
    model: nn.Module,
    work_dir: str | Path,
    calibration_path: str | Path,
) -> Dict:
    video_path = Path(video_path)

    scores_df = analyze_video(
        video_path=video_path,
        model=model,
        work_dir=work_dir,
    )

    raw_summary = aggregate_video_score(scores_df)

    calibration = load_calibration(calibration_path)
    calibrated = calibrated_risk_score(
        raw_summary["raw_final_score_0_1"],
        calibration,
    )

    audio_result = analyze_audio(video_path)

    visual_probability = calibrated["deepfake_probability_0_100"]
    audio_probability = audio_result["audio_score"]

    fused_probability = round(
        0.80 * visual_probability + 0.20 * audio_probability,
        2,
    )

    calibrated["visual_probability_0_100"] = visual_probability
    calibrated["audio_probability_0_100"] = audio_probability
    calibrated["deepfake_probability_0_100"] = fused_probability

    top_df = scores_df.sort_values("fake_score", ascending=False).head(10).copy()
    top_df["approx_second"] = top_df["frame_number"] / cfg.fps_sample

    return {
        "video": video_path.name,
        "raw_summary": raw_summary,
        "calibrated_result": calibrated,
        "audio_result": audio_result,
        "top_suspicious_frames": top_df[
            ["image_path", "fake_score", "approx_second"]
        ].to_dict(orient="records"),
    }