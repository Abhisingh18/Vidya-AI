# Vendored Claude Code skills

Third-party skills copied into this repo after a file-by-file review. They are
pinned to the commits below and are **not** auto-updated. To update one, re-clone
the source, re-review the diff, and copy it in by hand — don't run
`npx skills update`, `npx remotion upgrade` or `npx hyperframes skills update`,
which replace these folders with unreviewed versions.

| Skills | Source | Commit | License |
|---|---|---|---|
| `manim-composer`, `manimce-best-practices` | https://github.com/adithya-s-k/manim_skill | `cef0450` (2026-01-24) | MIT |
| `remotion-captions`, `remotion-create`, `remotion-docs`, `remotion-interactivity`, `remotion-maps`, `remotion-markup`, `remotion-multimedia`, `remotion-render`, `remotion-saas`, `remotion-studio` | https://github.com/remotion-dev/skills | `1441a11` (2026-10-16) | No LICENSE file in repo (plugin manifest says MIT) |

## Not installed

- `manimgl-best-practices` — we render with Manim Community Edition; mixing in the
  ManimGL API confuses code generation.
- `remotion-upgrade` — runs `npx skills update … --yes`, which silently replaces
  the reviewed skills.
- `remotion-best-practices` — a router bundling copies of every Remotion skill,
  including the upgrade flow above.

## Local patches

- `remotion-markup/voiceover.md` — asks the user to set `ELEVENLABS_API_KEY` in
  the environment instead of asking for the key in chat.
- `remotion-maps/…/maptiler/references/map-geo-prep.md`,
  `remotion-maps/…/maptiler/TECHNIQUE.md` (and the copies under
  `remotion-markup/remotion-maps/`) — keep MapTiler/OpenStreetMap attribution
  visible instead of hiding it with CSS (required by the provider terms).

## Notes

- The Remotion framework (not these skill files) needs a paid company license for
  for-profit companies with more than 3 employees: https://www.remotion.pro/license
- `remotion-docs` sends search queries to Remotion's Algolia index.
- API keys (ElevenLabs, MapTiler, AWS, …) go in env vars / `.env.local`, never in chat.
