"use client";

import { useActionState } from "react";
import { entrar } from "@/app/acciones";

export function FormularioEntrar() {
  const [estado, accion, entrando] = useActionState(entrar, {});

  return (
    <form action={accion} className="mt-8 flex flex-col gap-3">
      <label htmlFor="contrasena" className="text-secundario text-[17px]">
        Contraseña
      </label>
      <input
        id="contrasena"
        name="contrasena"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        aria-invalid={!!estado.error}
        aria-describedby={estado.error ? "error-entrar" : undefined}
        className="border-borde bg-claro/5 text-claro min-h-[48px] rounded-full border px-5 text-[18px]"
      />
      {estado.error && (
        <p id="error-entrar" role="alert" className="text-rosa text-[16px]">
          {estado.error}
        </p>
      )}
      <button type="submit" className="pildora pildora-vino mt-3" disabled={entrando}>
        {entrando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
