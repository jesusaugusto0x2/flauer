-- How long a video is, typed in by hand (optional). IF NOT EXISTS keeps it safe to re-run.
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "duration_seconds" integer;
