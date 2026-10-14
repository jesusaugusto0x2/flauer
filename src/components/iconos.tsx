/** Un poema = una flor. */
export function Flor({
  tamano = 12,
  className,
}: {
  tamano?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={tamano}
      height={tamano}
      aria-hidden="true"
      className={className}
    >
      <g fill="#e9b8c3">
        <circle cx="6" cy="3.1" r="2" />
        <circle cx="8.8" cy="5.1" r="2" />
        <circle cx="7.7" cy="8.4" r="2" />
        <circle cx="4.3" cy="8.4" r="2" />
        <circle cx="3.2" cy="5.1" r="2" />
      </g>
      <circle cx="6" cy="6" r="1.3" fill="#15142a" />
    </svg>
  );
}

/** Flor de trazo que decora la esquina del papel. */
export function FlorTrazo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 120"
      width={56}
      height={74}
      fill="none"
      stroke="#8a3b4c"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M46 44 C40 30 42 18 46 12 C50 18 52 30 46 44 Z" />
      <path d="M46 44 C32 40 24 32 22 24 C30 24 40 30 46 44 Z" />
      <path d="M46 44 C60 40 68 32 70 24 C62 24 52 30 46 44 Z" />
      <path d="M46 44 C36 52 26 54 20 50 C26 44 36 42 46 44 Z" />
      <path d="M46 44 C56 52 66 54 72 50 C66 44 56 42 46 44 Z" />
      <circle cx="46" cy="44" r="3.2" />
      <path d="M46 48 C47 70 44 92 48 116" />
    </svg>
  );
}

/** Una flor por poema, en fila. */
export function Flores({
  cantidad,
  className,
}: {
  cantidad: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex flex-wrap gap-1 ${className ?? ""}`} aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => (
        <Flor key={i} />
      ))}
    </span>
  );
}
