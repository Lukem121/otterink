import { blobGetPrivate } from "@/lib/blob";

/** Serves images from a private Blob store. Paths contain a random suffix, so they can be cached forever. */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path } = await ctx.params;
  const pathname = path.join("/");
  if (!pathname.startsWith("images/")) return new Response("Not found", { status: 404 });
  try {
    const res = await blobGetPrivate(pathname);
    if (!res) return new Response("Not found", { status: 404 });
    return new Response(res.stream, {
      headers: {
        "content-type": res.blob.contentType ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
