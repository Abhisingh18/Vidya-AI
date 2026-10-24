#!/bin/bash
# Starts the local Indic-Speak server on http://127.0.0.1:8808 (first run downloads ≈7 GB).
cd "$(dirname "$0")"
[ -x .venv/bin/python ] || { echo "No .venv — run: uv venv --python 3.11 .venv && uv pip install --python .venv/bin/python -r requirements.txt"; exit 1; }
export PYTORCH_ENABLE_MPS_FALLBACK=1
exec .venv/bin/python -m uvicorn server:app --host 127.0.0.1 --port "${INDIC_SPEAK_PORT:-8808}"
