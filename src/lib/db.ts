import "server-only";
import { Pool, type QueryResultRow } from "pg";

/**
 * Postgres connection. Works with any provider (Neon, Supabase, Vercel Postgres…):
 * set DATABASE_URL (or POSTGRES_URL, which Vercel's database integrations add).
 */
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const dbEnabled = url.length > 0;

const g = globalThis as unknown as { __lpPool?: Pool; __lpSchema?: Promise<void> };

function pool(): Pool {
  if (!g.__lpPool) {
    g.__lpPool = new Pool({
      connectionString: url,
      // Serverless: keep it small, and let idle connections go quickly.
      max: 4,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
    g.__lpPool.on("error", (e) => console.error("[db] idle client error:", e.message));
  }
  return g.__lpPool;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS events (
    id            BIGSERIAL PRIMARY KEY,
    ts            TIMESTAMPTZ NOT NULL DEFAULT now(),
    type          TEXT NOT NULL,
    item_id       TEXT,
    item_kind     TEXT,
    item_title    TEXT,
    target_url    TEXT,
    visitor       TEXT NOT NULL,
    source        TEXT,
    medium        TEXT,
    campaign      TEXT,
    referrer_host TEXT,
    device        TEXT,
    browser       TEXT,
    os            TEXT,
    country       TEXT,
    region        TEXT,
    city          TEXT,
    tab           TEXT,
    query         TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS events_ts_idx ON events (ts DESC)`,
  `CREATE INDEX IF NOT EXISTS events_type_ts_idx ON events (type, ts DESC)`,
  `CREATE INDEX IF NOT EXISTS events_item_idx ON events (item_id, ts DESC) WHERE item_id IS NOT NULL`,
];

/** Creates the table on first use, so there is nothing to set up by hand. */
function ensureSchema(): Promise<void> {
  g.__lpSchema ??= (async () => {
    const client = await pool().connect();
    try {
      await client.query("BEGIN");
      // Stops two cold starts from creating the table at the same moment.
      await client.query("SELECT pg_advisory_xact_lock(727274)");
      for (const sql of SCHEMA) await client.query(sql);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  })().catch((e) => {
    g.__lpSchema = undefined; // try again on the next request
    throw e;
  });
  return g.__lpSchema;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  if (!dbEnabled) throw new Error("No database configured");
  await ensureSchema();
  const res = await pool().query<T>(text, params);
  return res.rows;
}
