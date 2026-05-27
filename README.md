# VidyaAI — Har topic, har bhasha, har student

AI-powered animated educational video generation platform for Indian students. Type any topic and watch AI teach it with synchronized voice narration, visual scenes (geometry, equations, diagrams), and a downloadable Manim source — in 22 Indian languages.

## Features

- **Generate animated videos on demand** — type any topic, pick grade + language, get a 4–5 minute lesson.
- **Multilingual TTS narration** — Hindi, English, Tamil, Telugu, Marathi, Bengali, Kannada, Malayalam, Gujarati, Punjabi (plus 12 more).
- **Live scene renderer** — SVG-based animations rendered in real time alongside the voice track. No video files to download.
- **Community library** — public gallery of 40+ pre-built lessons covering Math, Physics, Chemistry, Biology, CS, History — including 3Blue1Brown-style deep-learning topics (Neural Nets, Backpropagation, Fourier Transform, Eigenvalues, Transformers).
- **Manim export** — every generated lesson includes a Python Manim source so power users can render locally.
- **Auth + streaks + watch history** — NextAuth (Google + guest), Prisma, daily learning streaks.
- **Dark mode + custom cursor** — saffron-themed UI with animated cursor trail.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js (Google OAuth + guest sessions)
- **Database**: Prisma ORM — SQLite locally, swap to Postgres for production
- **LLM**: OpenRouter (free models — `gpt-oss-20b:free`, `gemma-4-31b-it:free`, `gpt-oss-120b:free`)
- **TTS**: Web Speech API (no external TTS service needed)
- **Icons**: lucide-react

## Project Structure

```
src/
  app/
    api/
      auth/[...nextauth]/   # NextAuth route
      generate/             # LLM call → script + scene + manim
      library/              # Public list + single-video endpoints
      videos/               # User-scoped CRUD + watch tracking
      user/stats/           # Streak + dashboard data
    library/                # Gallery page + /library/[id] watch page
    generate/               # Topic input + live player
    dashboard/              # Streak + history
  components/
    generated-video-player  # Player that combines TTS + SceneRenderer
    scene-renderer          # SVG animation engine
    navbar / footer
prisma/
  schema.prisma             # User, Video, Watch, Streak, Bookmark, …
  migrations/
scripts/
  seed-videos.mjs           # Bulk-loads 40 handcrafted lessons
  videos-data.mjs           # The lesson data itself
```

## Getting Started Locally

```bash
git clone https://github.com/Abhisingh18/Vidya-AI.git
cd Vidya-AI
npm install

# Set up env
cp .env.example .env.local
# Edit .env.local — add OPENROUTER_API_KEY (free at openrouter.ai/keys)

# Initialize DB + seed
npx prisma migrate dev
node scripts/seed-videos.mjs

npm run dev
```

Open <http://localhost:3000>.

## Environment Variables

See [`.env.example`](.env.example). Required:

| Variable                | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `NEXTAUTH_URL`          | Public URL of the app                           |
| `NEXTAUTH_SECRET`       | Random secret for JWT signing                   |
| `OPENROUTER_API_KEY`    | Free LLM access for `/api/generate`             |
| `GOOGLE_CLIENT_ID`      | Optional — Google OAuth                         |
| `GOOGLE_CLIENT_SECRET`  | Optional — Google OAuth                         |
| `DATABASE_URL`          | Optional override (defaults to local SQLite)    |

## Deployment

### Frontend → Vercel

1. Import this repo in the Vercel dashboard.
2. Add the env vars above in **Project Settings → Environment Variables**.
3. Build command: `npm run build`, Output: `.next` (Next.js auto-detected).
4. Set `NEXTAUTH_URL` to the Vercel-assigned URL.

### Database → Render (or any Postgres host)

The default `prisma/schema.prisma` uses SQLite. For Render:

1. Create a Postgres instance in Render → copy the connection string.
2. Change `provider = "postgresql"` in `prisma/schema.prisma`.
3. Set `DATABASE_URL` env var in Vercel to the Render Postgres URL.
4. Run `npx prisma migrate deploy` against the new DB.
5. Re-run `node scripts/seed-videos.mjs` to populate the library.

### Backend API routes

All `/api/*` routes ship with the Next.js app and run as serverless functions on Vercel — no separate backend deployment needed. If you want a dedicated Node service on Render, the API code in `src/app/api/` can be lifted into a standalone Express server using Prisma directly.

## Seeding the Library

The 40 pre-built lessons are defined in [`scripts/videos-data.mjs`](scripts/videos-data.mjs). Each entry has:

- `topic`, `language`, `grade`
- `duration` (seconds)
- `scriptLines` — array of narration strings (becomes timed TTS captions)
- `steps` — scene-renderer instructions (shapes, equations, transitions)

Add more entries to the `VIDEOS` array, then re-run `node scripts/seed-videos.mjs`. It is idempotent — skips topics already present for the seed user.

## Scripts

| Command                          | What it does                          |
| -------------------------------- | ------------------------------------- |
| `npm run dev`                    | Local dev server on :3000             |
| `npm run build`                  | Production build                      |
| `npm run start`                  | Run production build                  |
| `npx prisma studio`              | Browse the local DB in a GUI          |
| `node scripts/seed-videos.mjs`   | Seed the 40 pre-built lessons         |

## License

MIT — free to fork, learn from, and build on.
