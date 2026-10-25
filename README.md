# Flauer

A personal diary of poems, notes and songs. Every entry belongs to a day; on the calendar,
each day shows one flower per kind it has: pink for poems, gold for notes, lilac for songs.
Apart from the calendar, `/videos` keeps a list of videos stored on Google Drive or
YouTube. Reading is public; only the diary's owner can write.

Built with Next.js (App Router, Server Components, Server Actions, Cache Components), Neon
Postgres, Drizzle ORM, Zod, `jose` and Tailwind CSS. The code is in English; the UI is in
Spanish.

## Routes

| Route               | What it does                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/`                 | Calendar for the current month. `?month=2026-10` shows another.                                                    |
| `/day/YYYY-MM-DD`   | That day's entries as summaries; each opens its own page, and songs also open on Spotify.                          |
| `/entry/[id]`       | Read a poem, a note or a song (one view, styled by kind).                                                          |
| `/entry/[id]/edit`  | Edit an entry, or change its kind (session required).                                                              |
| `/write?date=…`     | New entry (session required). Defaults to today and a poem; `&kind=note` or `&kind=song` to start on another kind. |
| `/videos`           | Every video, the newest first. In write mode, the form to add one.                                                 |
| `/videos/[id]`      | Watch a video, with its date and note (the list stays at the side on desktop).                                     |
| `/videos/[id]/edit` | Edit a video (session required).                                                                                   |
| `/login`, `/logout` | Start and end the session. Nothing links to them.                                                                  |

`/poem/[id]`, the old poem URL, redirects to `/entry/[id]`.

## Entries

Poems, notes and songs share one `entries` table; the `kind` column (`poem` | `note` |
`song`) tells them apart.

- **Poems and notes** have a date, an optional title and a body.
- **Songs** have a date, the song's name (`title`), `artist`, `spotify_url` and an
  optional "why it fits" (`body`, up to 1000 characters). The diary can't read the name
  or artist from Spotify by itself, so they are typed in.

Spotify links are checked and cleaned in `src/lib/spotify.ts`: `open.spotify.com` links
(track, album, playlist, episode, show, artist; regional `/intl-xx/` paths and the `?si=`
share parameter are accepted and dropped), `spotify:track:…` app URIs and `spotify.link`
short links from the mobile app. Anything else is rejected. On phones with Spotify
installed, "Abrir en Spotify" opens the app.

## Videos

Videos aren't uploaded to the diary: they stay on the owner's Google Drive (or on YouTube),
and the `videos` table keeps where each one is (`source`: `drive` | `youtube`, and
`external_id`), a title, an optional note, whether it was recorded upright (`vertical`,
for a 9:16 frame) and `date`: the day it was added, in `America/Caracas`. The server sets
that date when the video is saved, and editing never changes it.

Links are read in `src/lib/video-links.ts`: Drive files (`/file/d/<id>/view`, `open?id=`,
`uc?id=`) and YouTube videos (`watch?v=`, `youtu.be`, `/shorts/`, `/embed/`, `/live/`).
Folders, documents and other sites are rejected. Only the ID is stored, and the page always
embeds Drive's or YouTube's own player built from it (`drive.google.com/file/d/<id>/preview`,
`youtube-nocookie.com/embed/<id>`).

For a Drive video to play for visitors, share it as _Anyone with the link_. Safari on
iPhone can block Drive's player inside other sites (its "Prevent Cross-Site Tracking"
setting), so every video page also links to the video on Drive or YouTube itself; if a
video doesn't play on an iPhone, uploading it to YouTube as _Unlisted_ works around it.

## Scrolling

Text boxes have a fixed height and scroll on their own, so long texts don't stretch the
page. On desktop, the day next to the calendar, the side lists while reading or writing,
and the list of videos fit in the window and scroll inside; the reading sheet does too. On
phones the page scrolls as usual.

"Today" is always computed in `America/Caracas` (`TIME_ZONE` in `src/lib/config.ts`). The
app name, subtitle and optional poem signature live in the same file.

## Environment variables

| Variable         | Purpose                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`   | Neon Postgres connection string. On Vercel the Neon integration sets it. |
| `OWNER_PASSWORD` | Password for `/login`. You choose it.                                    |
| `AUTH_SECRET`    | Random secret that signs the session cookie. At least 32 characters.     |

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is git-ignored: never
commit secrets. To generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Running locally

Requires Node 22.12+ (see `.nvmrc`) and pnpm.

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm db:migrate              # creates the tables
pnpm db:seed                 # optional: sample poems, notes, songs and videos
pnpm dev
```

For development, use your own **Neon branch** rather than the production database (Neon
console: _Branches → New branch_) and copy its connection string into `.env.local`. The Neon
integration stores `DATABASE_URL` in Vercel as a _sensitive_ variable, so `vercel env pull`
can't download it: copy it from the Neon console instead.

`pnpm db:seed` is for development only: it refuses to run with `NODE_ENV=production`, on
Vercel, or against a database that already has entries.

Other scripts:

```bash
pnpm lint          # ESLint
pnpm format        # Prettier
pnpm build         # production build
pnpm db:studio     # browse the database with Drizzle Studio
```

## Migrations

The schema lives in `src/db/schema.ts` and the versioned migrations in `drizzle/`.

```bash
# After changing the schema: generate a new migration and commit it
pnpm db:generate --name describe-the-change

# Apply pending migrations to the database in DATABASE_URL
pnpm db:migrate
```

`db:migrate` runs `scripts/migrate.ts`, which uses Neon's HTTP driver (the same one the app
uses) and prints a clear error when something fails.

On Vercel, `vercel.json` runs `pnpm db:migrate` before every **production** build, so
pending migrations reach the production database on deploy. If a migration fails, the
build fails and the previous deployment stays live. Preview builds skip migrations because
they share the same database.

## Deploying to Vercel

1. Import the repo in Vercel. `vercel.json` pins the framework to Next.js.
2. In the project: _Storage → Create Database → Neon_ (Marketplace) and connect it to the
   project. This injects `DATABASE_URL`.
3. In _Settings → Environment Variables_ add `OWNER_PASSWORD` and `AUTH_SECRET` for
   Production.
4. Deploy (or redeploy). The production build applies the migrations, then builds the app.
5. To write, go to `https://your-domain/login`.

For every future schema change: `pnpm db:generate`, commit and push. The next production
deploy migrates the database.
