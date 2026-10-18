import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { EVENT_TYPES, ITEM_KINDS } from "./analytics-types";

/** What the browser sends. Everything else (device, country, source…) is worked out here. */
export const TrackBody = z.object({
  t: z.enum(EVENT_TYPES),
  id: z.string().regex(/^[\w-]{1,64}$/).optional(),
  k: z.enum(ITEM_KINDS).optional(),
  title: z.string().max(160).optional(),
  url: z.string().max(500).optional(),
  tab: z.enum(["links", "shop"]).optional(),
  q: z.string().max(80).optional(),
  ref: z.string().max(500).optional(),
  us: z.string().max(60).optional(),
  um: z.string().max(60).optional(),
  uc: z.string().max(80).optional(),
});
export type TrackBody = z.infer<typeof TrackBody>;

export type EventRow = {
  type: string;
  item_id: string | null;
  item_kind: string | null;
  item_title: string | null;
  target_url: string | null;
  visitor: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer_host: string | null;
  device: string;
  browser: string;
  os: string;
  country: string | null;
  region: string | null;
  city: string | null;
  tab: string | null;
  query: string | null;
};

const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|discord|telegram|vercel|headless|lighthouse|pingdom|monitor|curl|wget|python|node-fetch|axios|go-http/i;

export function isBot(ua: string) {
  return !ua || BOT.test(ua);
}

export function parseUa(ua: string): { device: string; browser: string; os: string } {
  const tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const mobile = /Mobi|iPhone|iPod|Android/i.test(ua);
  const device = tablet ? "tablet" : mobile ? "mobile" : "desktop";

  let browser = "Other";
  if (/Instagram/i.test(ua)) browser = "Instagram app";
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) browser = "Facebook app";
  else if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) browser = "TikTok app";
  else if (/Pinterest/i.test(ua)) browser = "Pinterest app";
  else if (/Snapchat/i.test(ua)) browser = "Snapchat app";
  else if (/LinkedInApp/i.test(ua)) browser = "LinkedIn app";
  else if (/Twitter/i.test(ua)) browser = "X app";
  else if (/EdgA?\/|EdgiOS\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/Firefox|FxiOS/.test(ua)) browser = "Firefox";
  else if (/Chrome|CriOS/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua)) browser = "Safari";

  let os = "Other";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { device, browser, os };
}

const REFERRER_NAMES: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(facebook|fb)\.com$|(^|\.)fb\.me$/, "facebook"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, "pinterest"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "x"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)threads\.net$/, "threads"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)(etsy\.com)$/, "etsy"],
  [/(^|\.)(amazon\.[a-z.]+|amzn\.to)$/, "amazon"],
];

const UTM_ALIASES: Record<string, string> = { ig: "instagram", fb: "facebook", tt: "tiktok", yt: "youtube", tw: "x", twitter: "x", pin: "pinterest" };

function hostOf(ref: string | undefined): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

function clean(s: string | undefined, max: number): string | null {
  const v = s?.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max);
  return v ? v : null;
}

/** Where did this visit come from? utm tag first, then the referrer, then hints in the in-app browser. */
export function detectSource(body: TrackBody, ua: string, ownHost: string): { source: string; referrerHost: string | null } {
  const refHost = hostOf(body.ref);
  const external = refHost && refHost !== ownHost.replace(/^www\./, "") ? refHost : null;

  const utm = clean(body.us, 40)?.toLowerCase();
  if (utm) return { source: UTM_ALIASES[utm] ?? utm, referrerHost: external };

  if (external) {
    const known = REFERRER_NAMES.find(([re]) => re.test(external));
    return { source: known ? known[1] : external, referrerHost: external };
  }

  if (/Instagram/i.test(ua)) return { source: "instagram", referrerHost: null };
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return { source: "facebook", referrerHost: null };
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return { source: "tiktok", referrerHost: null };
  if (/Pinterest/i.test(ua)) return { source: "pinterest", referrerHost: null };
  if (/Snapchat/i.test(ua)) return { source: "snapchat", referrerHost: null };
  if (/LinkedInApp/i.test(ua)) return { source: "linkedin", referrerHost: null };
  return { source: "direct", referrerHost: null };
}

/**
 * Anonymous visitor id: a hash of IP + browser + today's date + a server secret.
 * It changes every day and the IP itself is never stored, so no cookies and no consent banner.
 */
export function visitorId(ip: string, ua: string, now = new Date()) {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "dev-secret";
  return createHash("sha256")
    .update(`${secret}|${now.toISOString().slice(0, 10)}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 16);
}

export function buildEvent(body: TrackBody, h: Headers): EventRow {
  const ua = h.get("user-agent") ?? "";
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const { source, referrerHost } = detectSource(body, ua, host);
  const device = parseUa(ua);

  let city: string | null = null;
  try {
    city = clean(decodeURIComponent(h.get("x-vercel-ip-city") ?? ""), 80);
  } catch {
    city = null;
  }

  const hasItem = body.t === "click" || body.t === "share" || body.t === "collection" || body.t === "tab";
  return {
    type: body.t,
    item_id: hasItem ? (body.id ?? null) : null,
    item_kind: hasItem ? (body.k ?? null) : null,
    item_title: hasItem ? clean(body.title, 160) : null,
    target_url: hasItem ? clean(body.url, 500) : null,
    visitor: visitorId(ip, ua),
    source,
    medium: clean(body.um, 60)?.toLowerCase() ?? null,
    campaign: clean(body.uc, 80),
    referrer_host: referrerHost,
    device: device.device,
    browser: device.browser,
    os: device.os,
    country: clean(h.get("x-vercel-ip-country") ?? undefined, 2)?.toUpperCase() ?? null,
    region: clean(h.get("x-vercel-ip-country-region") ?? undefined, 10),
    city,
    tab: body.tab ?? null,
    query: body.t === "search" ? clean(body.q, 80)?.toLowerCase() ?? null : null,
  };
}

/** Very small per-instance flood guard: at most 120 events a minute from one visitor. */
const hits = new Map<string, { n: number; reset: number }>();
export function tooMany(visitor: string, now = Date.now()) {
  const h = hits.get(visitor);
  if (!h || now > h.reset) {
    if (hits.size > 5000) hits.clear();
    hits.set(visitor, { n: 1, reset: now + 60_000 });
    return false;
  }
  return ++h.n > 120;
}
