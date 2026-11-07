import "server-only";
import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shareLinks } from "@/db/schema";
import { recordAttempt } from "./login-guard";

/** What a share link opens: one poem or note (an entry), or one video. */
export type ShareTarget = { kind: "entry" | "video"; id: string };

// Six characters from 56 that can't be mistaken for one another (no 0/O, 1/l/I):
// about 30 billion codes, and every lookup counts toward a limit per address.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_RE = /^[2-9a-km-np-zA-HJ-NP-Z]{6}$/;

function newCode() {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

const targetColumn = (kind: ShareTarget["kind"]) =>
  kind === "entry" ? shareLinks.entryId : shareLinks.videoId;

/** The item's code, if it is shared. */
export async function shareCode(target: ShareTarget): Promise<string | null> {
  const [row] = await db()
    .select({ code: shareLinks.code })
    .from(shareLinks)
    .where(eq(targetColumn(target.kind), target.id))
    .limit(1);
  return row?.code ?? null;
}

/** Shares the item, or returns the link it already has. */
export async function createShare(target: ShareTarget): Promise<string> {
  for (let tries = 0; tries < 5; tries++) {
    const existing = await shareCode(target);
    if (existing) return existing;
    const [row] = await db()
      .insert(shareLinks)
      .values({
        code: newCode(),
        entryId: target.kind === "entry" ? target.id : null,
        videoId: target.kind === "video" ? target.id : null,
      })
      .onConflictDoNothing()
      .returning({ code: shareLinks.code });
    if (row) return row.code;
    // The code was taken, or the item got a link meanwhile: look again.
  }
  throw new Error("Could not create a share code.");
}

/** "Dejar de compartir": the link stops working at once. */
export async function deleteShare(target: ShareTarget) {
  await db()
    .delete(shareLinks)
    .where(eq(targetColumn(target.kind), target.id));
}

/** What a code opens, or null (also once an address has tried too many). */
export async function openShare(code: string): Promise<ShareTarget | null> {
  if (!CODE_RE.test(code)) return null;
  const { allowed } = await recordAttempt("share");
  if (!allowed) return null;

  const [row] = await db()
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.code, code))
    .limit(1);
  if (row?.entryId) return { kind: "entry", id: row.entryId };
  if (row?.videoId) return { kind: "video", id: row.videoId };
  return null;
}

/** True when `code` (from the address) is the link for exactly this item. */
export async function codeOpens(code: unknown, target: ShareTarget) {
  if (typeof code !== "string") return false;
  const opened = await openShare(code);
  return opened?.kind === target.kind && opened.id === target.id;
}
