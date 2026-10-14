import { cambiarModo } from "@/app/acciones";
import type { Modo } from "@/lib/sesion";

const OPCIONES: { valor: Modo; texto: string }[] = [
  { valor: "lectura", texto: "Lectura" },
  { valor: "escritura", texto: "Escritura" },
];

export function InterruptorModo({ modo }: { modo: Modo }) {
  return (
    <form
      action={cambiarModo}
      role="group"
      aria-label="Modo"
      className="border-borde inline-flex rounded-full border p-[3px]"
    >
      {OPCIONES.map(({ valor, texto }) => {
        const activo = modo === valor;
        return (
          <button
            key={valor}
            type="submit"
            name="modo"
            value={valor}
            aria-pressed={activo}
            className={`min-h-[44px] rounded-full px-4 text-[16px] transition-colors ${
              activo
                ? "bg-claro text-noche font-semibold"
                : "text-secundario hover:text-claro"
            }`}
          >
            {texto}
          </button>
        );
      })}
    </form>
  );
}
