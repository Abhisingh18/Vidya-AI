# VidyaAI — Har topic, har bhasha, har student....
AI-powered animated educational video generation platform for Indian students. Type any topic and watch AI teach it with synchronized voice narration, visual scenes (geometry, equations, diagrams), and a downloadable Manim source — in 22 Indian languages.
## Deployed link:  https://vidya-qscffi5sh-abhishek-singhs-projects-3b6a3ace.vercel.app/
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

You need a Postgres database — easiest is a free one from
[Neon](https://neon.tech), [Supabase](https://supabase.com), or
[Render](https://render.com).

```bash
git clone https://github.com/Abhisingh18/Vidya-AI.git
cd Vidya-AI
npm install

# Set up env
cp .env.example .env.local
# Edit .env.local — add DATABASE_URL + OPENROUTER_API_KEY

# Push schema to DB + seed 40 lessons
npx prisma db push
npm run seed

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

This is a Next.js monolith — **frontend + backend deploy together on Vercel**.
There is no separate backend folder, because every `src/app/api/*/route.ts` runs
as a serverless function on the same Vercel deployment.

You only need two services:

| Service     | Purpose                                                  |
| ----------- | -------------------------------------------------------- |
| **Vercel**  | Hosts the app (UI + API routes)                          |
| **Render**  | Hosts the Postgres database (free tier is enough)        |

### Step 1 — Create Postgres on Render

1. Sign in to <https://render.com> → **New +** → **PostgreSQL**.
2. Pick the free plan, choose a region close to Vercel’s (e.g. Oregon / Frankfurt).
3. After creation, copy the **External Database URL** — looks like
   `postgresql://user:pass@host.oregon-postgres.render.com/dbname`.

### Step 2 — Deploy on Vercel

1. Sign in to <https://vercel.com> → **Add New → Project** → import the
   `Abhisingh18/Vidya-AI` repo.
2. In **Environment Variables**, add:

   | Key                   | Value                                           |
   | --------------------- | ----------------------------------------------- |
   | `DATABASE_URL`        | The Render Postgres URL from Step 1             |
   | `NEXTAUTH_URL`        | `https://<your-vercel-project>.vercel.app`      |
   | `NEXTAUTH_SECRET`     | Run `openssl rand -base64 32` to generate one   |
   | `OPENROUTER_API_KEY`  | Your key from <https://openrouter.ai/keys>      |
   | `GOOGLE_CLIENT_ID`    | (Optional — for Google login)                   |
   | `GOOGLE_CLIENT_SECRET`| (Optional — for Google login)                   |

3. Click **Deploy**. The build runs `prisma generate && prisma db push && next build`,
   which automatically creates the Postgres tables on first deploy.

### Step 3 — Seed the 40-video library

Once Vercel says “Ready”, populate the library by running the seed script against
your production DB from your local machine:

```bash
# In your local shell, point DATABASE_URL to the Render URL temporarily:
DATABASE_URL="postgresql://..." npm run seed
```

That’s it — visit your Vercel URL’s `/library` and you’ll see all 40 lessons.

### Re-deploys

Every `git push` to `main` triggers a Vercel rebuild. The `prisma db push`
step inside `build` reconciles your Postgres schema with any new fields you’ve
added to `prisma/schema.prisma`. If a schema change would drop data, the build
will fail safely — add `--accept-data-loss` to the build script only when you
intend that.

### Why not a separate `backend/` folder?

In a traditional split-stack app you’d have `frontend/` (React on Vercel) and
`backend/` (Express on Render). With Next.js App Router the API routes live
inside the same project and ship to the same serverless deployment. You only
need a separate backend service if you need long-running processes, WebSocket
servers, or background workers — none of which this app uses.

## Seeding the Library

The 40 pre-built lessons are defined in [`scripts/videos-data.mjs`](scripts/videos-data.mjs). Each entry has:

- `topic`, `language`, `grade`
- `duration` (seconds)
- `scriptLines` — array of narration strings (becomes timed TTS captions)
- `steps` — scene-renderer instructions (shapes, equations, transitions)

Add more entries to the `VIDEOS` array, then re-run `node scripts/seed-videos.mjs`. It is idempotent — skips topics already present for the seed user.

## Scripts

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Local dev server on :3000                                   |
| `npm run build`        | Prisma generate + db push + Next build (Vercel runs this)   |
| `npm run start`        | Run production build                                        |
| `npm run seed`         | Seed the 40 pre-built lessons                               |
| `npx prisma studio`    | Browse the DB in a GUI                                      |

## License

MIT — free to fork, learn from, and build on.
