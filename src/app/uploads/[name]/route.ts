import { promises as fs } from "node:fs";
import path from "node:path";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
};

/** Serves images uploaded in local development (production uses Vercel Blob). */
export async function GET(_req: Request, ctx: RouteContext<"/uploads/[name]">) {
  const { name } = await ctx.params;
  if (!/^[\w-]+\.\w+$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(process.cwd(), ".data", "uploads", name));
    const ext = name.split(".").pop() ?? "";
    return new Response(data, {
      headers: { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": "public, max-age=31536000" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
