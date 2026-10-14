import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { MODE_COOKIE, SESSION_COOKIE, SESSION_DAYS } from "./config";

export type Mode = "read" | "write";

const MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

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
  maxAge: MAX_AGE_SECONDS,
} as const;

export async function createSession() {
  const token = await new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("owner")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  (await cookies()).set(SESSION_COOKIE, token, cookieOptions);
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(MODE_COOKIE);
}

/** True when there is a valid, signed session cookie. */
export async function hasSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.sub === "owner";
  } catch {
    return false;
  }
}

/** Current UI mode. Without a session it is always "read". */
export async function currentMode(): Promise<{ session: boolean; mode: Mode }> {
  const session = await hasSession();
  if (!session) return { session, mode: "read" };
  const value = (await cookies()).get(MODE_COOKIE)?.value;
  return { session, mode: value === "write" ? "write" : "read" };
}

export async function saveMode(mode: Mode) {
  (await cookies()).set(MODE_COOKIE, mode, cookieOptions);
}
