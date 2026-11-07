import "server-only";
import { headers } from "next/headers";

/** The address this request came to (https://flauer.app), to build links to send. */
export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
