import Link from "next/link";
import { OutlineFlower } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="pt-16 text-center">
      <OutlineFlower className="mx-auto opacity-55 [&_*]:stroke-pink" />
      <p className="eyebrow mt-6">Página perdida</p>
      <h1 className="mt-2 font-hand text-[46px] leading-tight font-semibold">
        Aquí no creció ninguna flor
      </h1>
      <p className="mt-3 text-[18px] text-secondary italic">
        La página que buscas no existe o se la llevó el viento.
      </p>
      <Link href="/" className="pill mt-10">
        <span aria-hidden="true">←</span> Volver al calendario
      </Link>
    </main>
  );
}
