# Flauer

A personal diary of poems and notes. Every entry belongs to a day and shows up as a flower
on the calendar: pink for a poem, gold for a note. Reading is public; only the diary's
owner can write.

Built with Next.js (App Router, Server Components, Server Actions, Cache Components), Neon
Postgres, Drizzle ORM, Zod, `jose` and Tailwind CSS. The code is in English; the UI is in
Spanish.

## Routes

| Route               | What it does                                                                           |
| ------------------- | -------------------------------------------------------------------------------------- |
| `/`                 | Calendar for the current month. `?month=2026-10` shows another.                        |
| `/day/YYYY-MM-DD`   | Poems and notes for that day. Notes are read in full here.                             |
| `/poem/[id]`        | Read a poem.                                                                           |
| `/write?date=…`     | New poem or note (session required). Defaults to today; `&kind=note` starts on a note. |
| `/entry/[id]/edit`  | Edit a poem or note, or turn one into the other (session required).                    |
| `/login`, `/logout` | Start and end the session. Nothing links to them.                                      |

Poems and notes share one `entries` table; the `kind` column (`poem` | `note`) tells them
apart.

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
pnpm db:seed                 # optional: sample poems and notes
pnpm dev
```

For development, use your own **Neon branch** rather than the production database (Neon
console: _Branches → New branch_) and put its connection string in `.env.local`.

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

## Deploying to Vercel

1. Import the repo in Vercel. `vercel.json` pins the framework to Next.js.
2. In the project: _Storage → Create Database → Neon_ (Marketplace) and connect it to the
   project. This injects `DATABASE_URL`.
3. In _Settings → Environment Variables_ add `OWNER_PASSWORD` and `AUTH_SECRET`.
4. Apply the migrations to the production database from your machine:

   ```bash
   pnpm dlx vercel link
   pnpm dlx vercel env pull .env.local --environment=production
   pnpm db:migrate
   ```

5. Redeploy. To write, go to `https://your-domain/login`.

For every future schema change: `pnpm db:generate`, commit, and run `pnpm db:migrate`
against production before (or right after) deploying.
