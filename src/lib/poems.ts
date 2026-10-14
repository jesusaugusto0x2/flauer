import "server-only";
import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { poems, type Poem } from "@/db/schema";
import { toDate } from "./dates";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidId = (id: string) => UUID_RE.test(id);

export const displayTitle = (p: Pick<Poem, "title">) => p.title?.trim() || "Sin título";

export function firstLine(body: string) {
  return (
    body
      .split("\n")
      .find((l) => l.trim())
      ?.trim() ?? ""
  );
}

type PoemInput = { date: string; title: string | null; body: string };

/** Number of poems per day within a month (YYYY-MM). */
export async function countByDay(month: string): Promise<Record<string, number>> {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const rows = await db()
    .select({ date: poems.date, total: count() })
    .from(poems)
    .where(
      and(gte(poems.date, toDate(year, m, 1)), lte(poems.date, toDate(year, m, lastDay))),
    )
    .groupBy(poems.date);
  return Object.fromEntries(rows.map((r) => [r.date, r.total]));
}

export async function countOnDay(date: string): Promise<number> {
  const [row] = await db()
    .select({ total: count() })
    .from(poems)
    .where(eq(poems.date, date));
  return row?.total ?? 0;
}

export async function poemsOnDay(date: string): Promise<Poem[]> {
  return db()
    .select()
    .from(poems)
    .where(eq(poems.date, date))
    .orderBy(asc(poems.createdAt), asc(poems.id));
}

export async function getPoem(id: string): Promise<Poem | undefined> {
  if (!isValidId(id)) return undefined;
  const [poem] = await db().select().from(poems).where(eq(poems.id, id)).limit(1);
  return poem;
}

export async function createPoem(data: PoemInput) {
  const [poem] = await db().insert(poems).values(data).returning({ id: poems.id });
  return poem.id;
}

export async function updatePoem(id: string, data: PoemInput) {
  const rows = await db()
    .update(poems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(poems.id, id))
    .returning({ id: poems.id });
  return rows.length > 0;
}

export async function deletePoem(id: string) {
  const rows = await db()
    .delete(poems)
    .where(eq(poems.id, id))
    .returning({ date: poems.date });
  return rows[0]?.date;
}
