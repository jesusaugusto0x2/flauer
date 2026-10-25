// A video's length, typed as 1:23 (minutes:seconds) or 1:02:03. Safe on the client.

const MINUTES_RE = /^(\d{1,3}):([0-5]\d)$/;
const HOURS_RE = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;
const MAX_SECONDS = 24 * 60 * 60;

/** Seconds, or null when `input` isn't a length like 1:23 or 1:02:03. */
export function parseDuration(input: string): number | null {
  const raw = input.trim();
  const minutes = MINUTES_RE.exec(raw);
  const hours = HOURS_RE.exec(raw);
  const seconds = minutes
    ? Number(minutes[1]) * 60 + Number(minutes[2])
    : hours
      ? Number(hours[1]) * 3600 + Number(hours[2]) * 60 + Number(hours[3])
      : null;
  return seconds && seconds <= MAX_SECONDS ? seconds : null;
}

/** "1:23", or "1:02:03" past the hour. */
export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
