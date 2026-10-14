"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { clearAttempts, isCorrectPassword, recordAttempt } from "@/lib/login-guard";
import { createEntry, deleteEntry, isValidId, updateEntry } from "@/lib/entries";
import { createSession, hasSession, saveMode } from "@/lib/session";
import { entrySchema, type EntryField, type EntryFormState } from "@/lib/validation";

// Messages returned to the UI are in Spanish.
const NO_SESSION = "Tu sesión expiró. Vuelve a entrar para guardar.";

// ── Access ──────────────────────────────────────────────────────────────────

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const { allowed, ip } = await recordAttempt();
  if (!allowed) {
    return { error: "Demasiados intentos. Espera unos minutos y vuelve a probar." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !isCorrectPassword(password)) {
    return { error: "Esa no es la contraseña." };
  }

  await clearAttempts(ip);
  await createSession();
  await saveMode("write");
  redirect("/");
}

export async function setMode(formData: FormData) {
  if (!(await hasSession())) return;
  const mode = formData.get("mode");
  if (mode === "read" || mode === "write") await saveMode(mode);
}

// ── Entries (poems and notes) ───────────────────────────────────────────────

export type SaveEntryResult = EntryFormState & { redirectTo?: string };

export async function saveEntry(formData: FormData): Promise<SaveEntryResult> {
  if (!(await hasSession())) return { error: NO_SESSION };

  const values = {
    kind: String(formData.get("kind") ?? ""),
    date: String(formData.get("date") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
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
