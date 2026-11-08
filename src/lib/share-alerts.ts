import "server-only";
import { createHmac } from "node:crypto";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { after } from "next/server";
import { db } from "@/db";
import { shareViews, type EntryKind } from "@/db/schema";
import { APP_NAME, LOCALE, TIME_ZONE } from "./config";
import { mediumDate } from "./dates";
import { getEntry } from "./entries";
import { clientIp } from "./login-guard";
import { shareCode, type ShareTarget } from "./shares";
import { siteOrigin } from "./site";
import { getVideo } from "./videos";

/** What a share link just opened, as the owner will read it in the email. */
type SharedItem = {
  code: string;
  kind: EntryKind | "video";
  title: string | null;
  /** The item's day (YYYY-MM-DD). */
  date: string;
  /** Its page, e.g. /entry/<id>. */
  path: string;
};

/** Views by the same visitor within this many minutes are one visit: one email. */
const VISIT_MINUTES = 30;
/** Never more than this many emails a day (Resend's free plan sends 100). */
const MAX_ALERTS_PER_DAY = 30;

// Link previews (WhatsApp, Telegram, iMessage, Slack, Discord…), search engines,
// security scanners and scripts open links with nobody behind them. "Cubot" is a
// phone brand, not a bot.
const NOT_A_PERSON =
  /\b\w*(?<!cu)bot\b|crawler|spider|slurp|facebookexternalhit|whatsapp|preview|embedly|vkshare|headless|lighthouse|curl\/|wget\/|python|node-fetch|undici|axios|go-http-client|okhttp|java\/|libwww|scrapy|puppeteer|playwright|selenium/i;

function isPerson(userAgent: string) {
  return userAgent.length > 0 && !NOT_A_PERSON.test(userAgent);
}

/** "iPhone · Safari", from the browser's user agent. */
function deviceOf(ua: string) {
  const system = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(ua)
            ? "Mac"
            : /CrOS/.test(ua)
              ? "Chromebook"
              : /Linux/.test(ua)
                ? "Linux"
                : null;
  const browser = /Instagram/.test(ua)
    ? "Instagram"
    : /FBAN|FBAV/.test(ua)
      ? "Facebook"
      : /TikTok|BytedanceWebview/.test(ua)
        ? "TikTok"
        : /EdgA?\/|EdgiOS/.test(ua)
          ? "Edge"
          : /OPR\/|Opera/.test(ua)
            ? "Opera"
            : /SamsungBrowser/.test(ua)
              ? "Samsung Internet"
              : /CriOS|Chrome\//.test(ua)
                ? "Chrome"
                : /FxiOS|Firefox\//.test(ua)
                  ? "Firefox"
                  : /Safari\//.test(ua)
                    ? "Safari"
                    : null;
  return [system, browser].filter(Boolean).join(" · ") || "No se reconoce";
}

/** "Caracas, Venezuela", from Vercel's guess by address. Null when unknown. */
function placeOf(h: Headers) {
  let city = h.get("x-vercel-ip-city");
  try {
    city = city && decodeURIComponent(city);
  } catch {
    // Keep it as it came.
  }
  const code = h.get("x-vercel-ip-country");
  let country = code;
  try {
    country =
      (code && new Intl.DisplayNames([LOCALE], { type: "region" }).of(code)) || code;
  } catch {
    // Not a country code Intl knows: keep the code.
  }
  return [city, country].filter(Boolean).join(", ") || null;
}

const since = (minutes: number) => sql`now() - make_interval(mins => ${minutes})`;

/** Records the view; true when it starts a visit that should email the owner. */
async function recordView(code: string, visitor: string): Promise<boolean> {
  const [recent] = await db()
    .select({ id: shareViews.id })
    .from(shareViews)
    .where(
      and(
        eq(shareViews.code, code),
        eq(shareViews.visitor, visitor),
        gt(shareViews.viewedAt, since(VISIT_MINUTES)),
      ),
    )
    .limit(1);
  let alert = !recent;
  if (alert) {
    const [{ sent }] = await db()
      .select({ sent: count() })
      .from(shareViews)
      .where(and(eq(shareViews.alerted, true), gt(shareViews.viewedAt, since(24 * 60))));
    alert = sent < MAX_ALERTS_PER_DAY;
  }
  await db().insert(shareViews).values({ code, visitor, alerted: alert });
  return alert;
}

const YOUR = {
  poem: { item: "tu poema", see: "Ver el poema" },
  note: { item: "tu nota", see: "Ver la nota" },
  song: { item: "tu canción", see: "Ver la canción" },
  video: { item: "tu video", see: "Ver el video" },
} as const;

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

type View = { at: Date; place: string | null; device: string };

function compose(item: SharedItem, view: View, origin: string) {
  const your = YOUR[item.kind];
  const day = mediumDate(item.date);
  const what = item.title
    ? `${your.item} «${item.title}», del ${day},`
    : `${your.item} del ${day}`;
  const subject = item.title
    ? `Abrieron «${item.title}» con tu enlace`
    : `Abrieron ${your.item} del ${day} con tu enlace`;
  const when = new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  }).format(view.at);
  const city = TIME_ZONE.split("/").pop()!.replace(/_/g, " ");
  const details: [string, string][] = [
    ["Cuándo", `${when} (hora de ${city})`],
    ["Desde", view.place ? `${view.place} (aproximado)` : "No se sabe"],
    ["Dispositivo", view.device],
  ];
  const itemUrl = `${origin}${item.path}`;
  // The code, but not the link itself: a link in the email could be opened by a
  // mail scanner or a stray tap, and count as one more visit.
  const stop = `Código del enlace: ${item.code}. Para que deje de funcionar, ábrelo con tu sesión y toca «Dejar de compartir».`;

  const text = [
    `Alguien abrió ${what} con el enlace que compartiste.`,
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    `${your.see}: ${itemUrl}`,
    stop,
  ].join("\n");

  const rows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:3px 16px 3px 0;color:#6b6478;vertical-align:top">${label}</td><td style="padding:3px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;color:#2a2433;font-size:16px;line-height:1.5;max-width:520px">
<p style="margin:0 0 16px;font-size:18px">Alguien abrió ${escapeHtml(what)} con el enlace que compartiste.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;font-size:16px">${rows}</table>
<p style="margin:0 0 20px"><a href="${escapeHtml(itemUrl)}" style="color:#8a3b4c">${your.see}</a></p>
<p style="margin:0;font-size:13px;color:#6b6478">${stop}</p>
</div>`;

  return { subject, text, html };
}

// Overridable only to test against a local stand-in.
const RESEND_URL = process.env.RESEND_API_URL || "https://api.resend.com/emails";

async function deliver(email: { subject: string; text: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SHARE_ALERT_EMAIL;
  if (!key || !to) {
    console.info(
      "[share-alert] Not sent: RESEND_API_KEY or SHARE_ALERT_EMAIL is not set.",
    );
    return;
  }
  // From the diary's own domain (set up by Resend's Vercel integration), and if
  // Resend refuses it (say, not verified yet), from Resend's test address, which
  // only delivers to the email of the Resend account.
  const domain = process.env.RESEND_EMAIL_DOMAIN?.trim().replace(/^.*@/, "");
  const senders = [domain ? `avisos@${domain}` : null, "onboarding@resend.dev"].filter(
    (address): address is string => address !== null,
  );
  for (const address of senders) {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${APP_NAME} <${address}>`, to: [to], ...email }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      console.info(`[share-alert] Sent from ${address}.`);
      return;
    }
    const detail = (await response.text()).slice(0, 300);
    console.error(
      `[share-alert] Resend refused it from ${address} (${response.status}): ${detail}`,
    );
    // Only a problem with the sender is worth trying the other one.
    if (response.status !== 403 && response.status !== 422) return;
  }
}

/** The shared item as the email names it, or null if it's gone. */
async function sharedItem(target: ShareTarget, code: string): Promise<SharedItem | null> {
  if (target.kind === "video") {
    const video = await getVideo(target.id);
    if (!video) return null;
    return {
      code,
      kind: "video",
      title: video.title,
      date: video.date,
      path: `/videos/${video.id}`,
    };
  }
  const entry = await getEntry(target.id);
  if (!entry || entry.kind === "song") return null;
  return {
    code,
    kind: entry.kind,
    title: entry.title?.trim() || null,
    date: entry.date,
    path: `/entry/${entry.id}`,
  };
}

/**
 * Reported (through the sharedView action) by a share link's page once a
 * browser really shows it: link previews and scanners don't run the page's
 * JavaScript, so they never get here. Checks the code again and emails the
 * owner once per visit (SHARE_ALERT_EMAIL, through Resend). The email goes out
 * after the response, so a failure can't affect the page.
 */
export async function reportShareView(target: ShareTarget, code: string) {
  const h = await headers();
  const userAgent = h.get("user-agent") ?? "";
  if (!isPerson(userAgent)) return;
  // Still this item's link? It may have been withdrawn since the page loaded.
  if ((await shareCode(target)) !== code) return;
  const item = await sharedItem(target, code);
  if (!item) return;

  const [ip, origin] = await Promise.all([clientIp(), siteOrigin()]);
  // A keyed hash: enough to tell visitors apart, never the address itself.
  const visitor = createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(`${ip}\n${userAgent}`)
    .digest("base64url")
    .slice(0, 32);
  const view: View = { at: new Date(), place: placeOf(h), device: deviceOf(userAgent) };

  after(async () => {
    try {
      if (await recordView(item.code, visitor))
        await deliver(compose(item, view, origin));
    } catch (error) {
      console.error("[share-alert] Failed:", error);
    }
  });
}
