-- Day visits: each time someone without the owner's session looks at a day's page, so
-- the owner gets one email per visit. Written to be safe to re-run (the migrator records
-- a migration only after all its statements have run).
CREATE TABLE IF NOT EXISTS "day_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"visitor" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"alerted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "day_visits_visit_idx" ON "day_visits" USING btree ("date","visitor","viewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "day_visits_viewed_at_idx" ON "day_visits" USING btree ("viewed_at");
