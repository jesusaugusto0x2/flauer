-- Videos: their own list at /videos, kept on Google Drive or YouTube.
-- Written to be safe to re-run (the migrator records a migration only after all
-- its statements have run).
DO $$ BEGIN
	CREATE TYPE "public"."video_source" AS ENUM('drive', 'youtube');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "video_source" NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"vertical" boolean DEFAULT false NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "videos_created_idx" ON "videos" USING btree ("created_at");
