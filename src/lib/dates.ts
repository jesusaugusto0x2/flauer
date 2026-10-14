import { LOCALE, TIME_ZONE } from "./config";

// Diary dates are YYYY-MM-DD strings (calendar days, no time of day).
// To format them they are read as UTC midnight and formatted in UTC,
// so no time zone can shift them to another day.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function toMonth(year: number, month: number) {
  return `${year}-${pad(month)}`;
}

/** Today's date (YYYY-MM-DD) in America/Caracas. */
export function today(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isValidDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
  );
}

export function isValidMonth(value: string): boolean {
  const m = MONTH_RE.exec(value);
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

function toUTC(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function format(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...options }).format(
    toUTC(date),
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Miércoles, 14 de octubre de 2026" */
export function longDate(date: string) {
  return capitalize(
    format(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  );
}

/** "14 de octubre de 2026" */
export function mediumDate(date: string) {
  return format(date, { day: "numeric", month: "long", year: "numeric" });
}

/** "14 de octubre" */
export function shortDate(date: string) {
  return format(date, { day: "numeric", month: "long" });
}

/** "miércoles" */
export function weekday(date: string) {
  return format(date, { weekday: "long" });
}

/** "octubre" */
export function monthName(month: string) {
  return format(`${month}-01`, { month: "long" });
}

/** "Octubre 2026" */
export function monthTitle(month: string) {
  return `${capitalize(monthName(month))} ${month.slice(0, 4)}`;
}

export function monthOf(date: string) {
  return date.slice(0, 7);
}

export function addMonths(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(year, m - 1 + delta, 1));
  return toMonth(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

/** Weeks of the month, Monday to Sunday. Days outside the month are null. */
export function weeksOfMonth(month: string): (string | null)[][] {
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  // getUTCDay: 0 = Sunday. Shift it so 0 = Monday.
  const offset = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;

  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(toDate(year, m, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Spanish count label: "1 poema", "3 poemas". */
export function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
