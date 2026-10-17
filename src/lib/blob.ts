import "server-only";
import { get, put, type PutBlobResult } from "@vercel/blob";

/** Blob is connected either by a read-write token or by store ID + Vercel OIDC (newer stores). */
export const blobEnabled = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

type Access = "public" | "private";

/** A store is created as public or private; we learn which on the first write and remember it. */
let known: Access | null = process.env.BLOB_ACCESS === "private" ? "private" : process.env.BLOB_ACCESS === "public" ? "public" : null;

function order(): Access[] {
  return known === "private" ? ["private", "public"] : ["public", "private"];
}

export async function blobPut(
  pathname: string,
  body: string | Blob | File,
  contentType: string,
): Promise<PutBlobResult & { access: Access }> {
  let lastError: unknown;
  for (const access of order()) {
    try {
      const res = await put(pathname, body, { access, addRandomSuffix: true, contentType });
      known = access;
      return { ...res, access };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function blobGetText(urlOrPathname: string): Promise<string | null> {
  for (const access of order()) {
    try {
      const res = await get(urlOrPathname, { access, useCache: access === "public" ? undefined : false });
      if (!res) return null;
      known = access;
      return await new Response(res.stream).text();
    } catch {
      // try the other access mode
    }
  }
  return null;
}

/** Streams a private blob for the /media route. */
export async function blobGetPrivate(pathname: string) {
  return get(pathname, { access: "private" });
}

/** URL to use in the page: public blobs load directly, private ones go through /media. */
export function publicUrl(res: { url: string; pathname: string; access: Access }) {
  return res.access === "public" ? res.url : `/media/${res.pathname}`;
}
