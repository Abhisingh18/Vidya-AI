# Indic-Speak — local TTS for VidyaAI

Runs [`bodhan-ai/indic-speak`](https://huggingface.co/bodhan-ai/indic-speak) (3B params, 22 Indian
languages + English, STEM- and code-mix-aware) on your own machine. VidyaAI's `/api/tts` uses it for
languages Piper has no voice for (Tamil, Gujarati, Kannada, Punjabi, Odia, Assamese…), or for every
language with `INDIC_SPEAK_PREFER=1`. If the server is off, the app simply uses Piper.

## One-time setup

1. **Request access** (the model is gated) — signed in as the Hugging Face account whose token is in
   `.env.local`, open https://huggingface.co/bodhan-ai/indic-speak, fill the form and accept the
   *Indic Open Model License* (access is automatic).
2. **Token permission** — a fine-grained token also needs *"Read access to contents of all public
   gated repos you can access"* (huggingface.co/settings/tokens), or use a classic *Read* token.
3. Environment (already created here): `uv venv --python 3.11 .venv && uv pip install --python .venv/bin/python -r requirements.txt`

## Run

```bash
tools/indic-speak/run.sh                  # first run downloads ≈7 GB into ./models, then listens on :8808
curl localhost:8808/health                # {"ready": true, "device": "mps", …}
```

Then set `INDIC_SPEAK_URL=http://127.0.0.1:8808` in `.env.local` and restart `npm run dev`.

## Limits

- Needs ~8–10 GB RAM and is slower than real time on a laptop, so the player buffers ahead for it.
- Self-hosting is free, **including commercial use**. Running it as a hosted API that *other
  people or companies* call directly needs Bodhan AI's written sign-off (see the license). Check
  that before offering VidyaAI's voice publicly from your own server.
- Not deployable on Vercel (size and GPU): production keeps using Piper.
- Credit: "Built with Indic-Speak from Bodhan AI / AI4Bharat."
