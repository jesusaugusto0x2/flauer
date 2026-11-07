"use client";

import { useActionState, useId } from "react";
import { unlock } from "@/app/actions";

const LOOK = {
  // On a poem's or a note's sheet.
  paper: {
    prompt: "text-ink-soft",
    input: "border-ink/25 bg-white/55 text-ink placeholder:text-ink-soft/60",
    error: "text-wine",
  },
  // On the night background (videos).
  night: {
    prompt: "text-secondary",
    input: "border-soft-border bg-light/5 text-light placeholder:text-muted",
    error: "text-pink",
  },
} as const;

/**
 * Asks for the reader's password in place of what it guards. Once it's right,
 * the page shows everything (and so does every other one, for a few days).
 */
export function UnlockForm({
  prompt,
  tone = "night",
}: {
  /** "Este poema tiene clave. Escríbela para leerlo." */
  prompt: string;
  tone?: keyof typeof LOOK;
}) {
  const [state, action, pending] = useActionState(unlock, {});
  const look = LOOK[tone];
  const id = useId();

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor={id} className={`text-[18px] leading-snug italic ${look.prompt}`}>
        {prompt}
      </label>
      <div className="flex flex-wrap gap-2.5">
        <input
          id={id}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Clave"
          aria-invalid={!!state.error}
          aria-describedby={state.error ? `${id}-error` : undefined}
          className={`min-h-12 min-w-0 flex-[1_1_200px] rounded-full border px-5 text-[18px] ${look.input}`}
        />
        <button type="submit" className="pill pill-wine px-6" disabled={pending}>
          {pending ? "Abriendo…" : "Entrar"}
        </button>
      </div>
      {state.error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={`text-[16px] font-semibold ${look.error}`}
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
