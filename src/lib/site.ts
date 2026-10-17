import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { readSite } from "./store";

/** Cached copy of the site for public pages. Saving in the admin calls updateTag("site"). */
export async function getPublishedSite() {
  "use cache";
  cacheLife("max");
  cacheTag("site");
  return readSite();
}
