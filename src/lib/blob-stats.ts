import "server-only";
import { del, list } from "@vercel/blob";
import { blobGetText, blobPut } from "./blob";

/**
 * Analytics stored in Vercel Blob (no database needed).
 *
 * Events are buffered in memory for a few seconds and written as one small
 * "shard" file per batch: stats/<day>/<time>-<rand>.json. When the admin reads
 * analytics, shards for days that are over are merged into one "compact" file
 * so reads stay cheap.
 */

export type StatDay = { v: number; c: Record<string, number>; s: Record<string, number> };
type Compact = StatDay & { from: string[] };

const PREFIX = "stats/";
const FLUSH_DELAY_MS = 5000;

let pending: Record<string, StatDay> = {};
let flushing: Promise<void> | null = null;

function empty(): StatDay {
  return { v: 0, c: {}, s: {} };
}

function merge(into: StatDay, add: StatDay) {
  into.v += add.v;
  for (const [k, n] of Object.entries(add.c)) into.c[k] = (into.c[k] ?? 0) + n;
  for (const [k, n] of Object.entries(add.s)) into.s[k] = (into.s[k] ?? 0) + n;
}

/** Adds an event to the buffer. The returned promise resolves once it's written; pass it to after(). */
export function queueStat(day: string, apply: (s: StatDay) => void): Promise<void> {
  apply((pending[day] ??= empty()));
  flushing ??= (async () => {
    await new Promise((r) => setTimeout(r, FLUSH_DELAY_MS));
    const batch = pending;
    pending = {};
    flushing = null;
    await Promise.all(
      Object.entries(batch).map(([d, stat]) =>
        blobPut(`${PREFIX}${d}/${Date.now()}.json`, JSON.stringify(stat), "application/json"),
      ),
    );
  })();
  return flushing;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const text = await blobGetText(url);
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

/** Reads per-day totals for the given days, compacting finished days as it goes. */
export async function readBlobStats(days: string[], today: string): Promise<Record<string, StatDay>> {
  const wanted = new Set(days);
  const byDay = new Map<string, { url: string; pathname: string }[]>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const day = b.pathname.slice(PREFIX.length, PREFIX.length + 10);
      if (!wanted.has(day)) continue;
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push({ url: b.url, pathname: b.pathname });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const out: Record<string, StatDay> = {};
  await Promise.all(
    [...byDay].map(async ([day, files]) => {
      const docs = (await Promise.all(files.map((f) => fetchJson<StatDay | Compact>(f.url)))).filter(
        (d): d is StatDay | Compact => !!d,
      );
      // Two compactions racing can leave duplicate compact files built from the same shards; count each once.
      const seen = new Set<string>();
      const total = empty();
      for (const doc of docs) {
        if ("from" in doc) {
          const key = [...doc.from].sort().join("|");
          if (seen.has(key)) continue;
          seen.add(key);
        }
        merge(total, doc);
      }
      out[day] = total;

      // Compact days that ended at least a day ago and still have more than one file.
      const ageDays = (Date.parse(today) - Date.parse(day)) / 86400000;
      if (ageDays >= 2 && files.length > 1) {
        try {
          const compact: Compact = { ...total, from: files.map((f) => f.pathname) };
          await blobPut(`${PREFIX}${day}/compact.json`, JSON.stringify(compact), "application/json");
          await del(files.map((f) => f.url));
        } catch {
          // Compaction is an optimisation; the shards are still correct if it fails.
        }
      }
    }),
  );
  return out;
}
