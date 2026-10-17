import { after } from "next/server";
import { recordClick, recordView } from "@/lib/store";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|discord|telegram|vercel|headless/i;

export async function POST(req: Request) {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  let body: { t?: string; id?: string; src?: string };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  try {
    if (body.t === "view") {
      const src = String(body.src || "direct").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40) || "direct";
      after(recordView(src).catch(() => {}));
    } else if (body.t === "click" && typeof body.id === "string" && /^[\w-]{1,64}$/.test(body.id)) {
      after(recordClick(body.id).catch(() => {}));
    }
  } catch {
    // Analytics must never break the page.
  }
  return new Response(null, { status: 204 });
}
