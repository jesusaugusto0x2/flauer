import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const entryKind = pgEnum("entry_kind", ["poem", "note", "song"]);

// A diary entry: a poem, a note or a song. Poems and notes use title and body.
// Songs use title (the song's name), artist, spotify_url and, optionally, body
// (why it fits the day).
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: entryKind("kind").notNull().default("poem"),
    // The day the entry belongs to (YYYY-MM-DD), not when it was created.
    date: date("date", { mode: "string" }).notNull(),
    title: text("title"),
    body: text("body").notNull(),
    artist: text("artist"),
    spotifyUrl: text("spotify_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("entries_date_idx").on(t.date, t.createdAt)],
);

export const videoSource = pgEnum("video_source", ["drive", "youtube"]);

// A video kept on Google Drive or YouTube: the diary stores where it is, not the
// file. Videos have their own list at /videos, apart from the calendar.
export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: videoSource("source").notNull(),
    // The file's ID on Drive, or the video's ID on YouTube.
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    note: text("note"),
    // Recorded upright on a phone (9:16) rather than sideways (16:9).
    vertical: boolean("vertical").notNull().default(false),
    // Typed in by hand, if at all: Drive and YouTube don't tell it to the page.
    durationSeconds: integer("duration_seconds"),
    // The day it was added (YYYY-MM-DD, America/Caracas). It never changes.
    date: date("date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("videos_created_idx").on(t.createdAt)],
);

// A short code that opens one poem, note or video without the reader's password.
// Deleting the entry or video deletes its link; "Dejar de compartir" deletes it too.
export const shareLinks = pgTable(
  "share_links",
  {
    code: text("code").primaryKey(),
    entryId: uuid("entry_id")
      .unique()
      .references(() => entries.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .unique()
      .references(() => videos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "share_links_one_target",
      sql`(${t.entryId} is null) <> (${t.videoId} is null)`,
    ),
  ],
);

// Each time a share link opens its item for someone, so the owner gets one email
// per visit. `visitor` is a keyed hash of the address and browser, never the
// address itself; `alerted` marks the views that sent (or tried to send) an email.
export const shareViews = pgTable(
  "share_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code")
      .notNull()
      .references(() => shareLinks.code, { onDelete: "cascade" }),
    visitor: text("visitor").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
    alerted: boolean("alerted").notNull().default(false),
  },
  (t) => [
    index("share_views_visit_idx").on(t.code, t.visitor, t.viewedAt),
    index("share_views_viewed_at_idx").on(t.viewedAt),
  ],
);

// Each time someone without the owner's session looks at a day's page, so the
// owner gets one email per visit. `visitor` as in share_views.
export const dayVisits = pgTable(
  "day_visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date", { mode: "string" }).notNull(),
    visitor: text("visitor").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
    alerted: boolean("alerted").notNull().default(false),
  },
  (t) => [
    index("day_visits_visit_idx").on(t.date, t.visitor, t.viewedAt),
    index("day_visits_viewed_at_idx").on(t.viewedAt),
  ],
);

// Attempts at the passwords and share codes, used to rate-limit them.
export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export type Entry = typeof entries.$inferSelect;
export type EntryKind = Entry["kind"];

export type Video = typeof videos.$inferSelect;
export type VideoSource = Video["source"];
