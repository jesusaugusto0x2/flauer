import "server-only";
import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { entries, type Entry, type EntryKind } from "@/db/schema";
import type { KindCounts } from "./kinds";
import { toDate } from "./dates";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidId = (id: string) => UUID_RE.test(id);

type EntryInput = { kind: EntryKind; date: string; title: string | null; body: string };

/** Poems and notes per day within a month (YYYY-MM). */
export async function countByDay(month: string): Promise<Record<string, KindCounts>> {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const rows = await db()
    .select({ date: entries.date, kind: entries.kind, total: count() })
    .from(entries)
    .where(
      and(
        gte(entries.date, toDate(year, m, 1)),
        lte(entries.date, toDate(year, m, lastDay)),
      ),
    )
    .groupBy(entries.date, entries.kind);

  const byDay: Record<string, KindCounts> = {};
  for (const row of rows) {
    byDay[row.date] ??= { poem: 0, note: 0 };
    byDay[row.date][row.kind] = row.total;
  }
  return byDay;
}

/** Every entry of a day, poems and notes mixed, in the order they were written. */
export async function entriesOnDay(date: string): Promise<Entry[]> {
  return db()
    .select()
    .from(entries)
    .where(eq(entries.date, date))
    .orderBy(asc(entries.createdAt), asc(entries.id));
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  if (!isValidId(id)) return undefined;
  const [entry] = await db().select().from(entries).where(eq(entries.id, id)).limit(1);
  return entry;
}

export async function createEntry(data: EntryInput) {
  const [entry] = await db().insert(entries).values(data).returning({ id: entries.id });
  return entry.id;
}

export async function updateEntry(id: string, data: EntryInput) {
  const rows = await db()
    .update(entries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(entries.id, id))
    .returning({ id: entries.id });
  return rows.length > 0;
}

export async function deleteEntry(id: string) {
  const rows = await db()
    .delete(entries)
    .where(eq(entries.id, id))
    .returning({ date: entries.date });
  return rows[0]?.date;
}
