-- Poems and notes now live in one table: rename "poems" to "entries" and add "kind".
-- Existing rows keep their data and become poems.
CREATE TYPE "public"."entry_kind" AS ENUM('poem', 'note');--> statement-breakpoint
ALTER TABLE "poems" RENAME TO "entries";--> statement-breakpoint
ALTER TABLE "entries" RENAME CONSTRAINT "poems_pkey" TO "entries_pkey";--> statement-breakpoint
ALTER INDEX "poems_date_idx" RENAME TO "entries_date_idx";--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "kind" "entry_kind" DEFAULT 'poem' NOT NULL;
