import "server-only";
import { createHmac } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import {
  MODE_COOKIE,
  READER_COOKIE,
  READER_DAYS,
  SESSION_COOKIE,
  SESSION_DAYS,
} from "./config";

export type Mode = "read" | "write";

const DAY_SECONDS = 24 * 60 * 60;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_DAYS * DAY_SECONDS,
} as const;

async function signedCookie(
  subject: string,
  claims: Record<string, string>,
  days: number,
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secretKey());
}

async function readSignedCookie(name: string) {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export async function createSession() {
  const token = await signedCookie("owner", { role: "owner" }, SESSION_DAYS);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions);
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(MODE_COOKIE);
}

/** True when there is a valid, signed session cookie. */
export async function hasSession(): Promise<boolean> {
  return (await readSignedCookie(SESSION_COOKIE))?.sub === "owner";
}

/**
 * Which reader's password the pass was given for, without revealing it: a new
 * password closes every pass given for the old one.
 */
function readerPasswordStamp() {
  const password = process.env.READER_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", secretKey())
    .update(password)
    .digest("base64url")
    .slice(0, 16);
}

/** After the reader's password: everything opens to read, for READER_DAYS. */
export async function grantReaderPass() {
  const stamp = readerPasswordStamp();
  if (!stamp) return;
  const token = await signedCookie("reader", { stamp }, READER_DAYS);
  (await cookies()).set(READER_COOKIE, token, {
    ...cookieOptions,
    maxAge: READER_DAYS * DAY_SECONDS,
  });
}

async function hasReaderPass(): Promise<boolean> {
  const payload = await readSignedCookie(READER_COOKIE);
  const stamp = readerPasswordStamp();
  return payload?.sub === "reader" && !!stamp && payload.stamp === stamp;
}

/**
 * Who is looking. Without a session the mode is always "read". `canRead`: may
 * open every poem, note and video (the owner, or with the reader's password).
 */
export async function currentMode(): Promise<{
  session: boolean;
  mode: Mode;
  canRead: boolean;
}> {
  const session = await hasSession();
  if (!session) return { session, mode: "read", canRead: await hasReaderPass() };
  const value = (await cookies()).get(MODE_COOKIE)?.value;
  return { session, mode: value === "write" ? "write" : "read", canRead: true };
}

export async function saveMode(mode: Mode) {
  (await cookies()).set(MODE_COOKIE, mode, cookieOptions);
}
