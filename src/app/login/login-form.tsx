"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <label htmlFor="password" className="text-[17px] text-secondary">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        aria-invalid={!!state.error}
        aria-describedby={state.error ? "login-error" : undefined}
        className="min-h-[48px] rounded-full border border-soft-border bg-light/5 px-5 text-[18px] text-light"
      />
      {state.error && (
        <p id="login-error" role="alert" className="text-[16px] text-pink">
          {state.error}
        </p>
      )}
      <button type="submit" className="pill pill-wine mt-3" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
