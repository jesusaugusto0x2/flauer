"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAttempts,
  isCorrectPassword,
  isCorrectReaderPassword,
  recordAttempt,
} from "@/lib/login-guard";
import { createEntry, deleteEntry, isValidId, updateEntry } from "@/lib/entries";
import { createSession, grantReaderPass, hasSession, saveMode } from "@/lib/session";
import { createShare, deleteShare, type ShareTarget } from "@/lib/shares";
import {
  entrySchema,
  videoSchema,
  type EntryField,
  type EntryFormState,
  type VideoField,
  type VideoFormState,
} from "@/lib/validation";
import { createVideo, deleteVideo, updateVideo } from "@/lib/videos";

// Messages returned to the UI are in Spanish.
const NO_SESSION = "Tu sesión expiró. Vuelve a entrar para guardar.";
const TOO_MANY = "Demasiados intentos. Espera unos minutos y vuelve a probar.";

// ── Access ──────────────────────────────────────────────────────────────────

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const { allowed, ip } = await recordAttempt("login");
  if (!allowed) return { error: TOO_MANY };

  const password = formData.get("password");
  if (typeof password !== "string" || !isCorrectPassword(password)) {
    return { error: "Esa no es la contraseña." };
  }

  await clearAttempts("login", ip);
  await createSession();
  await saveMode("write");
  redirect("/");
}

/** The reader's password: opens every poem, note and video to read, on this browser. */
export async function unlock(_: LoginState, formData: FormData): Promise<LoginState> {
  const { allowed, ip } = await recordAttempt("reader");
  if (!allowed) return { error: TOO_MANY };

  const password = formData.get("password");
  if (typeof password !== "string" || !isCorrectReaderPassword(password)) {
    return { error: "Esa no es la clave." };
  }

  await clearAttempts("reader", ip);
  await grantReaderPass();
  refresh();
  return {};
}

export async function setMode(formData: FormData) {
  if (!(await hasSession())) return;
  const mode = formData.get("mode");
  if (mode === "read" || mode === "write") await saveMode(mode);
}

// ── Entries (poems, notes and songs) ────────────────────────────────────────

export type SaveEntryResult = EntryFormState & { redirectTo?: string };

export async function saveEntry(formData: FormData): Promise<SaveEntryResult> {
  if (!(await hasSession())) return { error: NO_SESSION };

  const values = {
    kind: String(formData.get("kind") ?? ""),
    date: String(formData.get("date") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    artist: String(formData.get("artist") ?? ""),
    spotifyUrl: String(formData.get("spotifyUrl") ?? ""),
  };
  const id = formData.get("id");

  const parsed = entrySchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<EntryField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as EntryField;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  try {
    if (typeof id === "string" && id) {
      if (!isValidId(id) || !(await updateEntry(id, parsed.data))) {
        return { error: "Esa entrada ya no existe." };
      }
    } else {
      await createEntry(parsed.data);
    }
  } catch (e) {
    console.error(e);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  return { redirectTo: `/day/${parsed.data.date}` };
}

export async function removeEntry(id: string): Promise<{ error?: string }> {
  if (!(await hasSession())) return { error: NO_SESSION };
  if (!isValidId(id)) return { error: "Esa entrada ya no existe." };

  try {
    await deleteEntry(id);
  } catch (e) {
    console.error(e);
    return { error: "No se pudo borrar. Inténtalo de nuevo." };
  }

  refresh();
  return {};
}

// ── Videos ──────────────────────────────────────────────────────────────────

/** A new video stays on the list page (saved); an edited one goes back to it. */
export type SaveVideoResult = VideoFormState & { saved?: boolean; redirectTo?: string };

export async function saveVideo(formData: FormData): Promise<SaveVideoResult> {
  if (!(await hasSession())) return { error: NO_SESSION };

  const parsed = videoSchema.safeParse({
    link: String(formData.get("link") ?? ""),
    title: String(formData.get("title") ?? ""),
    note: String(formData.get("note") ?? ""),
    duration: String(formData.get("duration") ?? ""),
    vertical: formData.get("vertical") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<VideoField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as VideoField;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  const id = formData.get("id");
  try {
    if (typeof id === "string" && id) {
      if (!isValidId(id) || !(await updateVideo(id, parsed.data))) {
        return { error: "Ese video ya no existe." };
      }
      return { redirectTo: `/videos/${id}` };
    }
    await createVideo(parsed.data);
  } catch (e) {
    console.error(e);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  refresh();
  return { saved: true };
}

/** Deleted from its own page, so it goes back to the list. */
export async function removeVideo(id: string): Promise<{ error?: string }> {
  if (!(await hasSession())) return { error: NO_SESSION };
  if (!isValidId(id)) return { error: "Ese video ya no existe." };

  try {
    await deleteVideo(id);
  } catch (e) {
    console.error(e);
    return { error: "No se pudo borrar. Inténtalo de nuevo." };
  }

  redirect("/videos");
}

// ── Share links ─────────────────────────────────────────────────────────────

const SHARE_KINDS: ShareTarget["kind"][] = ["entry", "video"];

/** The owner shares one poem, note or video: its code (a new one, or the one it has). */
export async function shareItem(
  target: ShareTarget,
): Promise<{ code?: string; error?: string }> {
  if (!(await hasSession())) return { error: NO_SESSION };
  if (!SHARE_KINDS.includes(target.kind) || !isValidId(target.id)) {
    return { error: "Eso ya no existe." };
  }

  try {
    return { code: await createShare(target) };
  } catch (e) {
    // Also when the item no longer exists (the link must point at something).
    console.error(e);
    return { error: "No se pudo crear el enlace. Inténtalo de nuevo." };
  }
}

/** "Dejar de compartir": the link stops opening it. */
export async function unshareItem(target: ShareTarget): Promise<{ error?: string }> {
  if (!(await hasSession())) return { error: NO_SESSION };
  if (!SHARE_KINDS.includes(target.kind) || !isValidId(target.id)) return {};

  try {
    await deleteShare(target);
  } catch (e) {
    console.error(e);
    return { error: "No se pudo quitar el enlace. Inténtalo de nuevo." };
  }
  return {};
}
