import {
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

// Attempts against /login, used to rate-limit it.
export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export type Entry = typeof entries.$inferSelect;
export type EntryKind = Entry["kind"];
