import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

const WINDOW_MINUTES = 15;
const MAX_PER_IP = 5;
// Global cap in case someone rotates IP addresses.
const MAX_GLOBAL = 30;

/** Compares the password with OWNER_PASSWORD in constant time. */
export function isCorrectPassword(attempt: string): boolean {
  const real = process.env.OWNER_PASSWORD;
  if (!real) throw new Error("Missing OWNER_PASSWORD environment variable.");
  // Hashing makes both inputs the same length, which timingSafeEqual requires.
  const a = createHash("sha256").update(attempt).digest();
  const b = createHash("sha256").update(real).digest();
  return timingSafeEqual(a, b);
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
 * Records a login attempt. `allowed` is false when the limit was exceeded and the
 * attempt must be rejected without checking the password.
 */
export async function recordAttempt(): Promise<{ allowed: boolean; ip: string }> {
  const ip = await clientIp();
  const [perIp, global] = await Promise.all([
    countAttempt(`ip:${ip}`),
    countAttempt("global"),
  ]);
  return { allowed: perIp <= MAX_PER_IP && global <= MAX_GLOBAL, ip };
}

export async function clearAttempts(ip: string) {
  await db()
    .delete(loginAttempts)
    .where(eq(loginAttempts.key, `ip:${ip}`));
}
