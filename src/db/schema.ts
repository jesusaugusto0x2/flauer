import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const poems = pgTable(
  "poems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The day the poem belongs to (YYYY-MM-DD), not when it was created.
    date: date("date", { mode: "string" }).notNull(),
    title: text("title"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("poems_date_idx").on(t.date, t.createdAt)],
);

// Attempts against /login, used to rate-limit it.
export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export type Poem = typeof poems.$inferSelect;
export type NewPoem = typeof poems.$inferInsert;
