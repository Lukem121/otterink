import "server-only";
import { query } from "./db";
import type { CountRow, EventType, ItemKind, Report, Totals } from "./analytics-types";
import type { EventRow } from "./track";

export async function recordEvent(e: EventRow) {
  await query(
    `INSERT INTO events (type, item_id, item_kind, item_title, target_url, visitor, source, medium, campaign,
                         referrer_host, device, browser, os, country, region, city, tab, query)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      e.type, e.item_id, e.item_kind, e.item_title, e.target_url, e.visitor, e.source, e.medium, e.campaign,
      e.referrer_host, e.device, e.browser, e.os, e.country, e.region, e.city, e.tab, e.query,
    ],
  );
}

export function safeTimeZone(tz: string | undefined) {
  try {
    if (tz) {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return tz;
    }
  } catch {}
  return "UTC";
}

type Range = { from: Date; to: Date; prevFrom: Date };

/** Day boundaries in the viewer's time zone, so "today" means their today. */
async function range(days: number, tz: string): Promise<Range> {
  const [r] = await query<{ from_ts: Date; to_ts: Date; prev_from: Date }>(
    `SELECT ((date_trunc('day', now() AT TIME ZONE $1) - ($2::int - 1) * interval '1 day') AT TIME ZONE $1) AS from_ts,
            now() AS to_ts,
            ((date_trunc('day', now() AT TIME ZONE $1) - (($2::int * 2) - 1) * interval '1 day') AT TIME ZONE $1) AS prev_from`,
    [tz, days],
  );
  return { from: r.from_ts, to: r.to_ts, prevFrom: r.prev_from };
}

const TOTALS_SQL = `
  SELECT COUNT(*) FILTER (WHERE type = 'view')::int AS views,
         COUNT(DISTINCT visitor)::int AS visitors,
         COUNT(*) FILTER (WHERE type = 'click')::int AS clicks,
         COUNT(DISTINCT visitor) FILTER (WHERE type = 'click')::int AS clickers
  FROM events WHERE ts >= $1 AND ts < $2`;

const toCounts = (rows: { label: string | null; n: number; extra?: number }[], fallback = "Unknown"): CountRow[] =>
  rows.map((r) => ({ label: r.label ?? fallback, n: r.n, extra: r.extra }));

export async function buildReport(days: number, tzIn?: string): Promise<Report> {
  const tz = safeTimeZone(tzIn);
  const { from, to, prevFrom } = await range(days, tz);
  const win = [from, to];

  const [
    totals, prev, daily, items, prevItems, sources, referrers, campaigns, countries, cities, devices, browsers, systems,
    hourly, weekday, searches, tabs, collections, shares, recent, all,
  ] = await Promise.all([
    query<Totals>(TOTALS_SQL, win),
    query<Totals>(TOTALS_SQL, [prevFrom, from]),
    query<{ day: string; views: number; visitors: number; clicks: number }>(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
              COALESCE(v.views, 0) AS views, COALESCE(v.visitors, 0) AS visitors, COALESCE(v.clicks, 0) AS clicks
       FROM generate_series(($1::timestamptz AT TIME ZONE $3)::date, ($2::timestamptz AT TIME ZONE $3)::date, interval '1 day') AS d
       LEFT JOIN (
         SELECT (ts AT TIME ZONE $3)::date AS day,
                COUNT(*) FILTER (WHERE type = 'view')::int AS views,
                COUNT(DISTINCT visitor)::int AS visitors,
                COUNT(*) FILTER (WHERE type = 'click')::int AS clicks
         FROM events WHERE ts >= $1 AND ts < $2 GROUP BY 1
       ) v ON v.day = d::date
       ORDER BY d`,
      [from, to, tz],
    ),
    query<{ id: string; kind: ItemKind | null; title: string | null; url: string | null; clicks: number; visitors: number }>(
      `SELECT item_id AS id,
              (array_agg(item_kind ORDER BY ts DESC))[1] AS kind,
              (array_agg(item_title ORDER BY ts DESC))[1] AS title,
              (array_agg(target_url ORDER BY ts DESC))[1] AS url,
              COUNT(*)::int AS clicks, COUNT(DISTINCT visitor)::int AS visitors
       FROM events WHERE type = 'click' AND item_id IS NOT NULL AND ts >= $1 AND ts < $2
       GROUP BY item_id ORDER BY clicks DESC, item_id LIMIT 100`,
      win,
    ),
    query<{ id: string; clicks: number }>(
      `SELECT item_id AS id, COUNT(*)::int AS clicks FROM events
       WHERE type = 'click' AND item_id IS NOT NULL AND ts >= $1 AND ts < $2 GROUP BY item_id`,
      [prevFrom, from],
    ),
    query<{ source: string; visitors: number; views: number; clicks: number; clickers: number }>(
      `SELECT COALESCE(source, 'direct') AS source,
              COUNT(DISTINCT visitor)::int AS visitors,
              COUNT(*) FILTER (WHERE type = 'view')::int AS views,
              COUNT(*) FILTER (WHERE type = 'click')::int AS clicks,
              COUNT(DISTINCT visitor) FILTER (WHERE type = 'click')::int AS clickers
       FROM events WHERE ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY visitors DESC, source LIMIT 15`,
      win,
    ),
    query<{ label: string | null; n: number }>(
      `SELECT referrer_host AS label, COUNT(*)::int AS n FROM events
       WHERE type = 'view' AND referrer_host IS NOT NULL AND ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY n DESC, 1 LIMIT 10`,
      win,
    ),
    query<{ campaign: string; views: number; clicks: number }>(
      `SELECT campaign, COUNT(*) FILTER (WHERE type = 'view')::int AS views, COUNT(*) FILTER (WHERE type = 'click')::int AS clicks
       FROM events WHERE campaign IS NOT NULL AND ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY views DESC, 1 LIMIT 10`,
      win,
    ),
    query<{ country: string | null; visitors: number; clicks: number }>(
      `SELECT country, COUNT(DISTINCT visitor)::int AS visitors, COUNT(*) FILTER (WHERE type = 'click')::int AS clicks
       FROM events WHERE ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY visitors DESC, 1 LIMIT 12`,
      win,
    ),
    query<{ city: string; country: string | null; visitors: number }>(
      `SELECT city, MAX(country) AS country, COUNT(DISTINCT visitor)::int AS visitors
       FROM events WHERE city IS NOT NULL AND ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY visitors DESC, 1 LIMIT 8`,
      win,
    ),
    query<{ label: string | null; n: number }>(
      `SELECT device AS label, COUNT(DISTINCT visitor)::int AS n FROM events WHERE ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY n DESC, 1`,
      win,
    ),
    query<{ label: string | null; n: number }>(
      `SELECT browser AS label, COUNT(DISTINCT visitor)::int AS n FROM events WHERE ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY n DESC, 1 LIMIT 8`,
      win,
    ),
    query<{ label: string | null; n: number }>(
      `SELECT os AS label, COUNT(DISTINCT visitor)::int AS n FROM events WHERE ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY n DESC, 1 LIMIT 8`,
      win,
    ),
    query<{ h: number; views: number; clicks: number }>(
      `SELECT EXTRACT(HOUR FROM ts AT TIME ZONE $3)::int AS h,
              COUNT(*) FILTER (WHERE type = 'view')::int AS views, COUNT(*) FILTER (WHERE type = 'click')::int AS clicks
       FROM events WHERE ts >= $1 AND ts < $2 GROUP BY 1`,
      [from, to, tz],
    ),
    query<{ d: number; views: number; clicks: number }>(
      `SELECT EXTRACT(DOW FROM ts AT TIME ZONE $3)::int AS d,
              COUNT(*) FILTER (WHERE type = 'view')::int AS views, COUNT(*) FILTER (WHERE type = 'click')::int AS clicks
       FROM events WHERE ts >= $1 AND ts < $2 GROUP BY 1`,
      [from, to, tz],
    ),
    query<{ label: string | null; n: number; extra: number }>(
      `SELECT query AS label, COUNT(*)::int AS n, COUNT(DISTINCT visitor)::int AS extra
       FROM events WHERE type = 'search' AND query IS NOT NULL AND ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY n DESC, 1 LIMIT 15`,
      win,
    ),
    query<{ label: string | null; n: number }>(
      `SELECT item_id AS label, COUNT(*)::int AS n FROM events WHERE type = 'tab' AND ts >= $1 AND ts < $2 GROUP BY 1 ORDER BY n DESC`,
      win,
    ),
    query<{ label: string | null; n: number }>(
      `SELECT COALESCE((array_agg(item_title ORDER BY ts DESC))[1], item_id) AS label, COUNT(*)::int AS n
       FROM events WHERE type = 'collection' AND ts >= $1 AND ts < $2 GROUP BY item_id ORDER BY n DESC LIMIT 10`,
      win,
    ),
    query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM events WHERE type = 'share' AND ts >= $1 AND ts < $2`, win),
    query<{
      ts: number; type: EventType; kind: ItemKind | null; title: string | null; query: string | null;
      source: string | null; country: string | null; city: string | null; device: string | null; browser: string | null;
    }>(
      `SELECT (EXTRACT(EPOCH FROM ts) * 1000)::float8 AS ts, type, item_kind AS kind, item_title AS title, query,
              source, country, city, device, browser
       FROM events ORDER BY ts DESC LIMIT 40`,
    ),
    query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM events`),
  ]);

  const prevById = new Map(prevItems.map((r) => [r.id, r.clicks]));
  const fillHours = Array.from({ length: 24 }, (_, h) => hourly.find((r) => r.h === h) ?? { views: 0, clicks: 0 });
  const fillDays = Array.from({ length: 7 }, (_, d) => weekday.find((r) => r.d === d) ?? { views: 0, clicks: 0 });

  return {
    days,
    from: from.toISOString(),
    to: to.toISOString(),
    tz,
    totals: totals[0],
    prev: prev[0],
    daily,
    items: items.map((r) => ({
      id: r.id, kind: r.kind, title: r.title ?? r.id, url: r.url ?? "", clicks: r.clicks, visitors: r.visitors, prevClicks: prevById.get(r.id) ?? 0,
    })),
    sources,
    referrers: toCounts(referrers),
    campaigns,
    countries: countries.map((r) => ({ ...r, country: r.country ?? "??" })),
    cities,
    devices: toCounts(devices),
    browsers: toCounts(browsers),
    systems: toCounts(systems),
    hourly: fillHours.map(({ views, clicks }) => ({ views, clicks })),
    weekday: fillDays.map(({ views, clicks }) => ({ views, clicks })),
    searches: toCounts(searches),
    tabs: toCounts(tabs),
    collections: toCounts(collections),
    shares: shares[0]?.n ?? 0,
    recent,
    totalEvents: all[0]?.n ?? 0,
  };
}

const csv = (v: unknown) => {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  // Leading = + - @ can run as a formula in Excel, so neutralise them.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Every event in the range as CSV (newest first, capped). */
export async function exportCsv(days: number, tzIn?: string): Promise<string> {
  const tz = safeTimeZone(tzIn);
  const { from, to } = await range(days, tz);
  const rows = await query(
    `SELECT ts, type, item_kind, item_title, target_url, source, medium, campaign, referrer_host,
            device, browser, os, country, region, city, tab, query, visitor
     FROM events WHERE ts >= $1 AND ts < $2 ORDER BY ts DESC LIMIT 100000`,
    [from, to],
  );
  const head = ["time_utc", "type", "item_kind", "item_title", "target_url", "source", "medium", "campaign", "referrer",
    "device", "browser", "os", "country", "region", "city", "tab", "search_query", "visitor_id"];
  return [head.join(","), ...rows.map((r) => Object.values(r).map(csv).join(","))].join("\n");
}

export async function clearAll() {
  await query(`TRUNCATE events RESTART IDENTITY`);
}
