"""Local text-to-speech server for bodhan-ai/indic-speak (22 Indian languages + English).

Run it with ./run.sh. VidyaAI's /api/tts calls POST /tts when INDIC_SPEAK_URL points here.
The model (≈7 GB, gated on Hugging Face) is downloaded once into ./models and runs on this
machine only — Apple GPU (MPS) when available, else CPU.

  POST /tts   {"text": "...", "language": "hi-IN", "gender": "female"}  ->  audio/mpeg
  GET  /health                                                         ->  {"ready": true, ...}
"""
import io
import os
import sys
import threading
import time
from collections import OrderedDict
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, Response
from huggingface_hub import snapshot_download
from pydantic import BaseModel

REPO = os.environ.get("INDIC_SPEAK_REPO", "bodhan-ai/indic-speak")
HERE = Path(__file__).resolve().parent
MODEL_DIR = Path(os.environ.get("INDIC_SPEAK_DIR", HERE / "models" / "indic-speak"))
SAMPLE_RATE = 24_000
MAX_CHARS = 500

# language code (BCP-47 as used by VidyaAI) -> {gender: speaker}. Speakers are the model's
# trained voices (see the model card); one female and one male per language.
VOICES = {
    "en-IN": {"female": "Kavya", "male": "Amit"},
    "hi-IN": {"female": "Kavya", "male": "Amit"},
    "bn-IN": {"female": "Ishita", "male": "Sourav"},
    "mr-IN": {"female": "Anagha", "male": "Chinmay"},
    "te-IN": {"female": "Sravani", "male": "Vamsi"},
    "ta-IN": {"female": "Anitha", "male": "Arun"},
    "gu-IN": {"female": "Dhara", "male": "Parth"},
    "kn-IN": {"female": "Deepika", "male": "Adarsh"},
    "ml-IN": {"female": "Lakshmi", "male": "Kiran"},
    "or-IN": {"female": "Itishree", "male": "Akash"},
    "pa-IN": {"female": "Kaur", "male": "Manpreet"},
    "as-IN": {"female": "Prastuti", "male": "Ankur"},
    "ur-IN": {"female": "Saba", "male": "Zaid"},
    "ne-NP": {"female": "Srijana", "male": "Sagar"},
    "brx-IN": {"female": "Sansuma", "male": "Gwrbw"},
    "doi-IN": {"female": "Preeti", "male": "Sham"},
    "kok-IN": {"female": "Anjali", "male": "Sandeep"},
    "ks-IN": {"female": "Zoon", "male": "Ishfaq"},
    "mai-IN": {"female": "Vaidehi", "male": "Madhukar"},
    "mni-IN": {"female": "Thoibi", "male": "Chaoba"},
    "sa-IN": {"female": "Bharati", "male": "Aryaman"},
    "sat-IN": {"female": "Phulmani", "male": "Sibu"},
    "sd-IN": {"female": "Moomal", "male": "Rano"},
}

state = {"ready": False, "device": None, "error": None, "loaded_in": None, "voices_checked": False}
lock = threading.Lock()  # one synthesis at a time: the model owns the GPU
cache: "OrderedDict[tuple, bytes]" = OrderedDict()
CACHE_MAX = 400


def hf_token():
    """HF_TOKEN from the environment, else from the project's .env.local (never printed)."""
    if os.environ.get("HF_TOKEN"):
        return os.environ["HF_TOKEN"]
    env = HERE.parent.parent / ".env.local"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("HF_TOKEN="):
                return line.split("=", 1)[1].strip().strip('"')
    return None


def download():
    if (MODEL_DIR / "model.safetensors").exists() and (MODEL_DIR / "inference.py").exists():
        return
    print(f"Downloading {REPO} (≈7 GB, once) into {MODEL_DIR} …", flush=True)
    snapshot_download(REPO, local_dir=MODEL_DIR, token=hf_token(), max_workers=4)


def load():
    t0 = time.time()
    try:
        download()
        sys.path.insert(0, str(MODEL_DIR))
        from inference import TTS  # shipped with the model (see its model card)

        tts = TTS(str(MODEL_DIR))
        want = os.environ.get("INDIC_SPEAK_DEVICE", "mps" if torch.backends.mps.is_available() else "cpu")
        device = "default"
        model = getattr(tts, "model", None) or getattr(tts, "lm", None)
        if want != "cpu" and model is not None:
            try:
                model.to(want)
                device = want
            except Exception as err:  # keep whatever the model's own loader chose
                print(f"could not move the model to {want}: {err}", flush=True)
        state.update(tts=tts, device=device)
        # warm-up: the first call compiles kernels; also proves the pipeline works end to end
        synth("नमस्ते", "hi-IN", "female")
        state.update(ready=True, loaded_in=round(time.time() - t0, 1))
        print(f"Indic-Speak ready on {device} in {state['loaded_in']} s", flush=True)
    except Exception as err:  # reported by /health, so the app can fall back to Piper
        state["error"] = f"{type(err).__name__}: {err}"
        print("Indic-Speak failed to start:", state["error"], flush=True)


def synth(text: str, language: str, gender: str) -> np.ndarray:
    voices = VOICES.get(language)
    if not voices:
        raise KeyError(language)
    speaker = voices.get(gender, voices["female"])
    with lock:
        wav = state["tts"](text, speaker=speaker)
    wav = np.asarray(wav, dtype=np.float32).squeeze()
    if wav.size < SAMPLE_RATE // 10:
        raise RuntimeError("model returned no audio")
    return wav


def encode(wav: np.ndarray) -> tuple[bytes, str]:
    wav = np.clip(wav, -1.0, 1.0)
    buf = io.BytesIO()
    try:
        sf.write(buf, wav, SAMPLE_RATE, format="MP3")
        return buf.getvalue(), "audio/mpeg"
    except Exception:  # libsndfile without MP3 support
        buf = io.BytesIO()
        sf.write(buf, wav, SAMPLE_RATE, format="WAV", subtype="PCM_16")
        return buf.getvalue(), "audio/wav"


class Req(BaseModel):
    text: str
    language: str = "hi-IN"
    gender: str = "female"


app = FastAPI(title="Indic-Speak (local)")


@app.on_event("startup")
def start():
    threading.Thread(target=load, daemon=True).start()


@app.get("/health")
def health():
    return {k: state[k] for k in ("ready", "device", "error", "loaded_in")} | {"languages": sorted(VOICES)}


@app.post("/tts")
def tts(req: Req):
    if not state["ready"]:
        return JSONResponse({"error": state["error"] or "model is still loading"}, status_code=503)
    text = " ".join(req.text.split())
    if not text or len(text) > MAX_CHARS:
        raise HTTPException(400, f"text must be 1–{MAX_CHARS} characters")
    if req.language not in VOICES:
        raise HTTPException(422, f"no voice for {req.language}")
    gender = "male" if req.gender == "male" else "female"
    key = (text, req.language, gender)
    if key in cache:
        cache.move_to_end(key)
        audio, mime = cache[key], "audio/mpeg"
    else:
        t0 = time.time()
        wav = synth(text, req.language, gender)
        audio, mime = encode(wav)
        print(f"{req.language}/{gender} {len(text)} chars -> {wav.size / SAMPLE_RATE:.1f}s audio in {time.time() - t0:.1f}s", flush=True)
        if mime == "audio/mpeg":
            cache[key] = audio
            if len(cache) > CACHE_MAX:
                cache.popitem(last=False)
    return Response(audio, media_type=mime, headers={"X-Voice": f"indic-speak:{VOICES[req.language][gender]}"})
