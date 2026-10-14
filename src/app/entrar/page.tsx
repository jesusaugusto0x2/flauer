import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Cargando } from "@/components/cargando";
import { haySesion } from "@/lib/sesion";
import { FormularioEntrar } from "./formulario-entrar";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function Entrar() {
  return (
    <main className="pt-16">
      <h1 className="font-mano text-center text-[46px] leading-tight font-semibold">
        Entrar
      </h1>
      <Suspense fallback={<Cargando />}>
        <ContenidoEntrar />
      </Suspense>
    </main>
  );
}

async function ContenidoEntrar() {
  if (await haySesion()) redirect("/");
  return <FormularioEntrar />;
}
