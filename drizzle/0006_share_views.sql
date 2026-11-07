-- Share views: each time a share link opens its item for someone, so the owner gets
-- one email per visit. Written to be safe to re-run (the migrator records a migration
-- only after all its statements have run).
CREATE TABLE IF NOT EXISTS "share_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"visitor" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"alerted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "share_views" ADD CONSTRAINT "share_views_code_share_links_code_fk" FOREIGN KEY ("code") REFERENCES "public"."share_links"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_views_visit_idx" ON "share_views" USING btree ("code","visitor","viewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "share_views_viewed_at_idx" ON "share_views" USING btree ("viewed_at");
