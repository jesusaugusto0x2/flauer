import { LOCALE, ZONA_HORARIA } from "./config";

// Las fechas del diario son cadenas AAAA-MM-DD (días del calendario, sin hora).
// Para darles formato se interpretan como medianoche UTC y se formatean en UTC,
// así ninguna zona horaria las corre de día.

const RE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const RE_MES = /^(\d{4})-(\d{2})$/;

const dos = (n: number) => String(n).padStart(2, "0");

export function aFecha(anio: number, mes: number, dia: number) {
  return `${anio}-${dos(mes)}-${dos(dia)}`;
}

export function aMes(anio: number, mes: number) {
  return `${anio}-${dos(mes)}`;
}

/** Fecha de hoy (AAAA-MM-DD) en America/Caracas. */
export function hoy(ahora: Date = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export function esFechaValida(valor: string): boolean {
  const m = RE_FECHA.exec(valor);
  if (!m) return false;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia
  );
}

export function esMesValido(valor: string): boolean {
  const m = RE_MES.exec(valor);
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

function aUTC(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function formatear(fecha: string, opciones: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...opciones }).format(
    aUTC(fecha),
  );
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Miércoles, 14 de octubre de 2026" */
export function fechaLarga(fecha: string) {
  return mayuscula(
    formatear(fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  );
}

/** "14 de octubre de 2026" */
export function fechaMedia(fecha: string) {
  return formatear(fecha, { day: "numeric", month: "long", year: "numeric" });
}

/** "14 de octubre" */
export function fechaCorta(fecha: string) {
  return formatear(fecha, { day: "numeric", month: "long" });
}

/** "miércoles" */
export function diaDeLaSemana(fecha: string) {
  return formatear(fecha, { weekday: "long" });
}

/** "Octubre 2026" */
export function nombreDelMes(mes: string) {
  return `${mayuscula(soloMes(mes))} ${mes.slice(0, 4)}`;
}

/** "octubre" */
export function soloMes(mes: string) {
  return formatear(`${mes}-01`, { month: "long" });
}

export function mesDe(fecha: string) {
  return fecha.slice(0, 7);
}

export function sumarMeses(mes: string, delta: number) {
  const [anio, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(anio, m - 1 + delta, 1));
  return aMes(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

/**
 * Semanas del mes, de lunes a domingo. Los huecos fuera del mes son null.
 */
export function semanasDelMes(mes: string): (string | null)[][] {
  const [anio, m] = mes.split("-").map(Number);
  const diasEnMes = new Date(Date.UTC(anio, m, 0)).getUTCDate();
  // getUTCDay: 0 = domingo. Lo pasamos a 0 = lunes.
  const desfase = (new Date(Date.UTC(anio, m - 1, 1)).getUTCDay() + 6) % 7;

  const celdas: (string | null)[] = Array(desfase).fill(null);
  for (let dia = 1; dia <= diasEnMes; dia++) celdas.push(aFecha(anio, m, dia));
  while (celdas.length % 7 !== 0) celdas.push(null);

  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}

export function plural(n: number, singular: string, varios: string) {
  return `${n} ${n === 1 ? singular : varios}`;
}
