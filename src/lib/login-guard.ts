import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

const WINDOW_MINUTES = 15;

/**
 * What is being tried, and how often per address (and in all, in case someone
 * rotates addresses) within the window: the owner's password, the reader's
 * password, and share codes, which people open on purpose a few times.
 */
const LIMITS = {
  login: { perIp: 5, global: 30 },
  reader: { perIp: 5, global: 30 },
  share: { perIp: 30, global: 300 },
} as const;

export type AttemptScope = keyof typeof LIMITS;

/** Compares two passwords in constant time. */
function samePassword(attempt: string, real: string) {
  // Hashing makes both inputs the same length, which timingSafeEqual requires.
  const a = createHash("sha256").update(attempt).digest();
  const b = createHash("sha256").update(real).digest();
  return timingSafeEqual(a, b);
}

/** The owner's password (OWNER_PASSWORD): reading and writing. */
export function isCorrectPassword(attempt: string): boolean {
  const real = process.env.OWNER_PASSWORD;
  if (!real) throw new Error("Missing OWNER_PASSWORD environment variable.");
  return samePassword(attempt, real);
}

/** The reader's password (READER_PASSWORD): reading only. Without it, nothing opens. */
export function isCorrectReaderPassword(attempt: string): boolean {
  const real = process.env.READER_PASSWORD;
  return !!real && samePassword(attempt, real);
}

async function clientIp() {
  const h = await headers();
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function countAttempt(key: string): Promise<number> {
  const expired = sql`${loginAttempts.windowStart} < now() - make_interval(mins => ${WINDOW_MINUTES})`;
  const [row] = await db()
    .insert(loginAttempts)
    .values({ key, attempts: 1 })
    .onConflictDoUpdate({
      target: loginAttempts.key,
      set: {
        attempts: sql`case when ${expired} then 1 else ${loginAttempts.attempts} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${loginAttempts.windowStart} end`,
      },
    })
    .returning({ attempts: loginAttempts.attempts });
  return row.attempts;
}

/**
 * Records an attempt. `allowed` is false when the limit was exceeded and the
 * attempt must be rejected without checking it.
 */
export async function recordAttempt(
  scope: AttemptScope,
): Promise<{ allowed: boolean; ip: string }> {
  const ip = await clientIp();
  const [perIp, global] = await Promise.all([
    countAttempt(`${scope}:ip:${ip}`),
    countAttempt(`${scope}:global`),
  ]);
  const limit = LIMITS[scope];
  return { allowed: perIp <= limit.perIp && global <= limit.global, ip };
}

export async function clearAttempts(scope: AttemptScope, ip: string) {
  await db()
    .delete(loginAttempts)
    .where(eq(loginAttempts.key, `${scope}:ip:${ip}`));
}
