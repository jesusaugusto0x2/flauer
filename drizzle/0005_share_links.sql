-- Share links: a short code that opens one poem, note or video without the reader's
-- password. Written to be safe to re-run (the migrator records a migration only after
-- all its statements have run).
CREATE TABLE IF NOT EXISTS "share_links" (
	"code" text PRIMARY KEY NOT NULL,
	"entry_id" uuid,
	"video_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_entry_id_unique" UNIQUE("entry_id"),
	CONSTRAINT "share_links_video_id_unique" UNIQUE("video_id"),
	CONSTRAINT "share_links_one_target" CHECK (("share_links"."entry_id" is null) <> ("share_links"."video_id" is null))
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "share_links" ADD CONSTRAINT "share_links_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "share_links" ADD CONSTRAINT "share_links_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
