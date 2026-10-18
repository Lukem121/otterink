import "server-only";
import { del, list } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { blobEnabled as blob, blobGetText, blobPut } from "./blob";
import { normalizeSite } from "./defaults";
import type { Site } from "./types";

/**
 * Page content: Vercel Blob if connected, else a JSON file in .data/ (local dev).
 * Analytics lives in Postgres: see analytics.ts.
 */

export const storageMode: "blob" | "file" = blob ? "blob" : "file";
/** On Vercel the filesystem is read-only, so file mode cannot save. */
export const storageWritable = blob || !process.env.VERCEL;

const FILE = path.join(process.cwd(), ".data", "db.json");

async function readFileSite(): Promise<Site | undefined> {
  try {
    return (JSON.parse(await fs.readFile(FILE, "utf8")) as { site?: Site }).site;
  } catch {
    return undefined;
  }
}

const BLOB_PREFIX = "content/site-";
const BLOB_KEEP = 20;

/** Each save is a new immutable blob, so reads are never stale and old versions act as history. */
async function blobVersions() {
  const { blobs } = await list({ prefix: BLOB_PREFIX, limit: 1000 });
  return blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
}

export async function readSite(): Promise<Site> {
  if (blob) {
    const [latest] = await blobVersions();
    if (!latest) return normalizeSite(null);
    const text = await blobGetText(latest.url);
    return normalizeSite(text ? JSON.parse(text) : null);
  }
  return normalizeSite(await readFileSite());
}

export async function writeSite(site: Site) {
  if (!storageWritable) {
    throw new Error("Storage is not connected. Add a Blob store to this project in Vercel, then redeploy.");
  }
  if (blob) {
    await blobPut(`${BLOB_PREFIX}${Date.now()}.json`, JSON.stringify(site), "application/json");
    const old = (await blobVersions()).slice(BLOB_KEEP).map((b) => b.url);
    if (old.length) await del(old);
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify({ site }, null, 2));
}
