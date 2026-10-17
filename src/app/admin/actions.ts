"use server";

import { timingSafeEqual, createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { blobEnabled, blobPut, publicUrl } from "@/lib/blob";
import { adminPassword, createSessionToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session";
import { readAnalytics, writeSite } from "@/lib/store";
import { SiteSchema, type Analytics, type Site } from "@/lib/types";

export type LoginState = { error?: string };

function sameSecret(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const expected = adminPassword();
  if (!expected) return { error: "ADMIN_PASSWORD is not set on the server." };
  const given = String(form.get("password") ?? "");
  if (!sameSecret(given, expected)) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Wrong password." };
  }
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function saveSite(input: Site): Promise<{ ok: true; site: Site } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = SiteSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `Invalid data at ${issue.path.join(".")}: ${issue.message}` };
  }
  const site = { ...parsed.data, updatedAt: new Date().toISOString() };
  try {
    await writeSite(site);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
  updateTag("site");
  return { ok: true, site };
}

const MAX_UPLOAD = 4 * 1024 * 1024;

export async function uploadImage(form: FormData): Promise<{ url: string } | { error: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "No file" };
  if (!file.type.startsWith("image/")) return { error: "Only images can be uploaded" };
  if (file.size > MAX_UPLOAD) return { error: "Image is larger than 4 MB" };

  const ext = (file.type.split("/")[1] ?? "png").replace("svg+xml", "svg").replace("jpeg", "jpg");
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;

  if (blobEnabled) {
    try {
      return { url: publicUrl(await blobPut(`images/${name}`, file, file.type)) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Upload failed" };
    }
  }
  if (process.env.VERCEL) {
    return { error: "Image storage is not connected. Add a Blob store to this project in Vercel, then redeploy." };
  }
  const dir = path.join(process.cwd(), ".data", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${name}` };
}

export type Preview = { title?: string; image?: string; price?: string };

/** Best-effort read of a page's Open Graph tags. Amazon often blocks this. */
export async function fetchPreview(url: string): Promise<Preview | { error: string }> {
  await requireAdmin();
  let target: URL;
  try {
    target = new URL(url);
    if (!/^https?:$/.test(target.protocol)) throw new Error();
  } catch {
    return { error: "Enter a full URL starting with https://" };
  }
  try {
    const res = await fetch(target, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const html = (await res.text()).slice(0, 600_000);
    const meta = (prop: string) => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
        "i",
      );
      const m = html.match(re);
      return decode(m?.[1] ?? m?.[2] ?? "");
    };
    const title =
      meta("og:title") || meta("twitter:title") || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
    let image = meta("og:image") || meta("twitter:image");
    if (!image) image = html.match(/id=["']landingImage["'][^>]*data-old-hires=["']([^"']+)["']/i)?.[1] ?? "";
    const amount = meta("product:price:amount") || meta("og:price:amount");
    const currency = meta("product:price:currency") || meta("og:price:currency");
    const price = amount ? `${currency === "USD" || !currency ? "$" : currency + " "}${amount}` : "";
    if (!title && !image) return { error: "That site didn't share any details. Fill them in by hand." };
    return {
      title: title.trim().slice(0, 200),
      image: image ? new URL(image, target).toString() : undefined,
      price: price || undefined,
    };
  } catch {
    return { error: "Couldn't reach that page. Fill the details in by hand." };
  }
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function getAnalytics(days: number): Promise<Analytics> {
  await requireAdmin();
  return readAnalytics(Math.min(Math.max(Math.round(days), 1), 365));
}
