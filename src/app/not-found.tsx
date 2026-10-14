import Link from "next/link";
import { OutlineFlower } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="pt-16 text-center">
      <OutlineFlower className="[&_*]:stroke-pink mx-auto opacity-55" />
      <p className="eyebrow mt-6">Página perdida</p>
      <h1 className="font-hand mt-2 text-[46px] leading-tight font-semibold">
        Aquí no creció ninguna flor
      </h1>
      <p className="text-secondary mt-3 text-[18px] italic">
        La página que buscas no existe o se la llevó el viento.
      </p>
      <Link href="/" className="pill mt-10">
        <span aria-hidden="true">←</span> Volver al calendario
      </Link>
    </main>
  );
}
