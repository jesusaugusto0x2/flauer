"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { clearAttempts, isCorrectPassword, recordAttempt } from "@/lib/login-guard";
import { createPoem, deletePoem, isValidId, updatePoem } from "@/lib/poems";
import { createSession, hasSession, saveMode } from "@/lib/session";
import { poemSchema, type PoemField, type PoemFormState } from "@/lib/validation";

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

// ── Poems ───────────────────────────────────────────────────────────────────

export type SavePoemResult = PoemFormState & { redirectTo?: string };

export async function savePoem(formData: FormData): Promise<SavePoemResult> {
  if (!(await hasSession())) return { error: NO_SESSION };

  const values = {
    date: String(formData.get("date") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  };
  const id = formData.get("id");

  const parsed = poemSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<PoemField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as PoemField;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  try {
    if (typeof id === "string" && id) {
      if (!isValidId(id) || !(await updatePoem(id, parsed.data))) {
        return { error: "Ese poema ya no existe." };
      }
    } else {
      await createPoem(parsed.data);
    }
  } catch (e) {
    console.error(e);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  return { redirectTo: `/day/${parsed.data.date}` };
}

export async function removePoem(id: string): Promise<{ error?: string }> {
  if (!(await hasSession())) return { error: NO_SESSION };
  if (!isValidId(id)) return { error: "Ese poema ya no existe." };

  try {
    await deletePoem(id);
  } catch (e) {
    console.error(e);
    return { error: "No se pudo borrar. Inténtalo de nuevo." };
  }

  refresh();
  return {};
}
