import "server-only";
import { Redis } from "@upstash/redis";
import { promises as fs } from "node:fs";
import path from "node:path";
import { normalizeSite } from "./defaults";
import type { Analytics, Site } from "./types";

/**
 * Storage: Upstash Redis when its env vars exist (production on Vercel),
 * otherwise a JSON file in .data/ (local development).
 */

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export const storageMode: "redis" | "file" = redis ? "redis" : "file";
/** On Vercel the filesystem is read-only, so file mode cannot save. */
export const storageWritable = !!redis || !process.env.VERCEL;

const SITE_KEY = "site";
const DAY_TTL = 60 * 60 * 24 * 400;

type StatDay = { v: number; c: Record<string, number>; s: Record<string, number> };
type FileDb = { site?: Site; stats?: Record<string, StatDay> };

const FILE = path.join(process.cwd(), ".data", "db.json");

async function readFileDb(): Promise<FileDb> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as FileDb;
  } catch {
    return {};
  }
}

async function writeFileDb(db: FileDb) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2));
}

export async function readSite(): Promise<Site> {
  if (redis) return normalizeSite(await redis.get<Site>(SITE_KEY));
  return normalizeSite((await readFileDb()).site);
}

export async function writeSite(site: Site) {
  if (!storageWritable) {
    throw new Error("Storage is not connected. Add Upstash Redis to this project in Vercel, then redeploy.");
  }
  if (redis) {
    await redis.set(SITE_KEY, site);
    return;
  }
  const db = await readFileDb();
  db.site = site;
  await writeFileDb(db);
}

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function recordView(source: string) {
  const day = dayKey();
  if (redis) {
    const p = redis.pipeline();
    p.incr(`a:v:${day}`);
    p.expire(`a:v:${day}`, DAY_TTL);
    p.hincrby(`a:s:${day}`, source, 1);
    p.expire(`a:s:${day}`, DAY_TTL);
    await p.exec();
    return;
  }
  if (!storageWritable) return;
  const db = await readFileDb();
  const stat = ((db.stats ??= {})[day] ??= { v: 0, c: {}, s: {} });
  stat.v++;
  stat.s[source] = (stat.s[source] ?? 0) + 1;
  await writeFileDb(db);
}

export async function recordClick(itemId: string) {
  const day = dayKey();
  if (redis) {
    const p = redis.pipeline();
    p.hincrby(`a:c:${day}`, itemId, 1);
    p.expire(`a:c:${day}`, DAY_TTL);
    await p.exec();
    return;
  }
  if (!storageWritable) return;
  const db = await readFileDb();
  const stat = ((db.stats ??= {})[day] ??= { v: 0, c: {}, s: {} });
  stat.c[itemId] = (stat.c[itemId] ?? 0) + 1;
  await writeFileDb(db);
}

export async function readAnalytics(numDays: number): Promise<Analytics> {
  const days: string[] = [];
  const now = Date.now();
  for (let i = numDays - 1; i >= 0; i--) days.push(dayKey(new Date(now - i * 86400000)));

  let raw: StatDay[];
  if (redis) {
    const p = redis.pipeline();
    for (const d of days) {
      p.get<number>(`a:v:${d}`);
      p.hgetall<Record<string, number>>(`a:c:${d}`);
      p.hgetall<Record<string, number>>(`a:s:${d}`);
    }
    const res = (await p.exec()) as unknown[];
    raw = days.map((_, i) => ({
      v: Number(res[i * 3] ?? 0),
      c: (res[i * 3 + 1] as Record<string, number> | null) ?? {},
      s: (res[i * 3 + 2] as Record<string, number> | null) ?? {},
    }));
  } else {
    const db = await readFileDb();
    raw = days.map((d) => db.stats?.[d] ?? { v: 0, c: {}, s: {} });
  }

  const items: Record<string, number> = {};
  const sources: Record<string, number> = {};
  const out: Analytics = { days: [], totals: { views: 0, clicks: 0 }, items: [], sources: [] };
  raw.forEach((stat, i) => {
    let clicks = 0;
    for (const [id, n] of Object.entries(stat.c)) {
      items[id] = (items[id] ?? 0) + Number(n);
      clicks += Number(n);
    }
    for (const [src, n] of Object.entries(stat.s)) sources[src] = (sources[src] ?? 0) + Number(n);
    out.days.push({ day: days[i], views: stat.v, clicks });
    out.totals.views += stat.v;
    out.totals.clicks += clicks;
  });
  out.items = Object.entries(items)
    .map(([id, clicks]) => ({ id, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
  out.sources = Object.entries(sources)
    .map(([source, views]) => ({ source, views }))
    .sort((a, b) => b.views - a.views);
  return out;
}
