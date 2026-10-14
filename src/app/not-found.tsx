import Link from "next/link";
import { FlorTrazo } from "@/components/iconos";

export default function NoEncontrado() {
  return (
    <main className="pt-16 text-center">
      <FlorTrazo className="[&_*]:stroke-rosa mx-auto opacity-55" />
      <p className="antetitulo mt-6">Página perdida</p>
      <h1 className="font-mano mt-2 text-[46px] leading-tight font-semibold">
        Aquí no creció ninguna flor
      </h1>
      <p className="text-secundario mt-3 text-[18px] italic">
        La página que buscas no existe o se la llevó el viento.
      </p>
      <Link href="/" className="pildora mt-10">
        <span aria-hidden="true">←</span> Volver al calendario
      </Link>
    </main>
  );
}
