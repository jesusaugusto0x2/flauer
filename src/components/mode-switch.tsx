import { setMode } from "@/app/actions";
import type { Mode } from "@/lib/session";

const OPTIONS: { value: Mode; label: string }[] = [
  { value: "read", label: "Lectura" },
  { value: "write", label: "Escritura" },
];

export function ModeSwitch({ mode }: { mode: Mode }) {
  return (
    <form
      action={setMode}
      role="group"
      aria-label="Modo"
      className="inline-flex rounded-full border border-soft-border p-[3px]"
    >
      {OPTIONS.map(({ value, label }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="submit"
            name="mode"
            value={value}
            aria-pressed={active}
            className={`min-h-[44px] rounded-full px-4 text-[16px] transition-colors ${
              active
                ? "bg-light font-semibold text-night"
                : "text-secondary hover:text-light"
            }`}
          >
            {label}
          </button>
        );
      })}
    </form>
  );
}
