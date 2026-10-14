-- Songs: a third kind of entry, with the song's artist and its Spotify link.
-- IF NOT EXISTS keeps it safe to re-run (the migrator records a migration only
-- after all its statements have run).
ALTER TYPE "public"."entry_kind" ADD VALUE IF NOT EXISTS 'song';--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "artist" text;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "spotify_url" text;
