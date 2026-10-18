import { after } from "next/server";
import { recordEvent } from "@/lib/analytics";
import { isAdmin } from "@/lib/auth";
import { dbEnabled } from "@/lib/db";
import { buildEvent, isBot, tooMany, TrackBody } from "@/lib/track";

const done = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  if (!dbEnabled) return done();

  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return done();

  // Only accept events sent from this site's own pages.
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return done();
    } catch {
      return done();
    }
  }

  let json: unknown;
  try {
    const text = await req.text();
    if (text.length > 4000) return done();
    json = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = TrackBody.safeParse(json);
  if (!parsed.success) return new Response(null, { status: 400 });

  // Don't count the owner's own visits while logged in to the admin.
  if (await isAdmin()) return done();

  const event = buildEvent(parsed.data, req.headers);
  if (tooMany(event.visitor)) return done();

  after(
    recordEvent(event).catch((e) => {
      console.error("[analytics] could not save event:", e instanceof Error ? e.message : e);
    }),
  );
  return done();
}
