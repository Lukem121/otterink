import { presetTheme } from "./themes";
import type { Collection, LinkItem, Product, Site } from "./types";

/** Starting content, migrated from beacons.ai/otter.inkk. Used until the first save in the admin. */
export function defaultSite(): Site {
  return {
    profile: {
      name: "Otter.inkk",
      tagline: "Cozy coloring & the supplies I use",
      bio: "",
      avatarUrl:
        "https://cdn.beacons.ai/user_content/C6u20nD9q4NEGd0A6qpORMs7G3r1/profile_otter.inkk.png?q=1792041417.766935",
    },
    socials: [
      { id: "s-ig", platform: "instagram", url: "https://instagram.com/otter.inkk", enabled: true },
      { id: "s-tt", platform: "tiktok", url: "https://tiktok.com/@otter.ink", enabled: true },
    ],
    links: [],
    products: [
      product("p-1", "Alcohol Markers", "https://link.amazon/B0efZER2R", amazonImage("81TrUMQwPNL")),
      product("p-2", "Cozy Vibes", "https://link.amazon/B0jm2AVER", amazonImage("81BRnEdv4KL")),
      product("p-3", "Girl Moments", "https://link.amazon/B0fxRqfmU", amazonImage("81ssiJZPMZL")),
      product("p-4", "Spooky Cutie", "https://link.amazon/B04s9u0er", amazonImage("81gGgqeUP0L")),
      product("p-5", "Cozy Season", "https://link.amazon/B04YpSyJi", amazonImage("81hKPQDc6CL")),
      product("p-6", "Cozy Capybara", "https://link.amazon/B0gtAzcv1", amazonImage("81+zOVq5raL")),
      product("p-7", "Cozy Corner", "https://link.amazon/B00UNORrh", amazonImage("81B7Me20erL")),
    ],
    collections: [],
    shop: {
      enabled: true,
      linksLabel: "Links",
      shopLabel: "Shop",
      defaultTab: "shop",
      showSearch: true,
      searchPlaceholder: "Search my favourites",
      collectionsPosition: "bottom",
      disclosure: "",
      buyLabel: "",
    },
    theme: presetTheme("mint"),
    seo: { title: "Otter.inkk", description: "Cozy coloring books and the art supplies I use." },
    updatedAt: new Date(0).toISOString(),
  };
}

/** Amazon's own product image, linked from their CDN (not re-hosted). */
function amazonImage(id: string) {
  return `https://m.media-amazon.com/images/I/${id}._SL600_.jpg`;
}

function product(id: string, title: string, url: string, imageUrl = ""): Product {
  return {
    id,
    title,
    url,
    imageUrl,
    price: "",
    badge: "",
    description: "",
    enabled: true,
    showInGrid: true,
    collectionIds: [],
  };
}

const BLANK_LINK: LinkItem = {
  id: "",
  kind: "link",
  title: "",
  subtitle: "",
  url: "",
  imageUrl: "",
  enabled: true,
  highlight: false,
};
const BLANK_PRODUCT = product("", "", "");
const BLANK_COLLECTION: Collection = { id: "", title: "", description: "", enabled: true };

/** Fill any fields missing from older saved data with defaults. */
const OLD_DISCLOSURE = "As an Amazon Associate I earn from qualifying purchases.";

export function normalizeSite(raw: unknown): Site {
  const d = defaultSite();
  const s = (raw ?? {}) as Partial<Site>;
  return {
    ...d,
    ...s,
    profile: { ...d.profile, ...s.profile },
    shop: {
      ...d.shop,
      ...s.shop,
      // The starter disclosure was removed; blank it out where it was saved unedited.
      disclosure: s.shop?.disclosure === OLD_DISCLOSURE ? "" : (s.shop?.disclosure ?? d.shop.disclosure),
    },
    theme: { ...d.theme, ...s.theme },
    seo: { ...d.seo, ...s.seo },
    socials: s.socials ?? d.socials,
    links: (s.links ?? d.links).map((l) => ({ ...BLANK_LINK, ...l })),
    products: (s.products ?? d.products).map((p) => withSeedImage({ ...BLANK_PRODUCT, ...p }, d.products)),
    collections: (s.collections ?? d.collections).map((c) => ({ ...BLANK_COLLECTION, ...c })),
  };
}

/** Products saved before images were added pick up the starter image for the same link. */
function withSeedImage(p: Product, seed: Product[]): Product {
  if (p.imageUrl) return p;
  const match = seed.find((x) => x.url === p.url && x.imageUrl);
  return match ? { ...p, imageUrl: match.imageUrl } : p;
}

/** Placeholder content from the very first version, before the real content was added. */
export function hasDemoContent(site: Site) {
  return (
    site.profile.name === "Your Name" ||
    site.products.some((p) => p.url === "https://amazon.com/") ||
    site.links.some((l) => l.url === "https://example.com")
  );
}

/** Swaps demo placeholders for the starter content, keeping anything the owner added. */
export function replaceDemoContent(site: Site): Site {
  const seed = defaultSite();
  const products = site.products.filter((p) => p.url !== "https://amazon.com/");
  const have = new Set(products.map((p) => p.url));
  const demoCollections = new Set(["c-1"]);
  return {
    ...site,
    profile: {
      ...site.profile,
      name: site.profile.name === "Your Name" ? seed.profile.name : site.profile.name,
      tagline: site.profile.tagline === "What you do, in one line" ? seed.profile.tagline : site.profile.tagline,
      avatarUrl: site.profile.avatarUrl || seed.profile.avatarUrl,
    },
    socials: site.socials.every((s) => /^https:\/\/(instagram|tiktok|youtube|pinterest)\.com\/$/.test(s.url)) ? seed.socials : site.socials,
    links: site.links.filter((l) => l.url !== "https://example.com" && !(l.kind === "header" && l.title === "Elsewhere")),
    products: [...seed.products.filter((p) => !have.has(p.url)), ...products.map((p) => ({ ...p, collectionIds: p.collectionIds.filter((c) => !demoCollections.has(c)) }))],
    collections: site.collections.filter((c) => !(demoCollections.has(c.id) && c.title === "My art supplies")),
    shop: { ...site.shop, defaultTab: "shop", searchPlaceholder: site.shop.searchPlaceholder === "Search products" ? seed.shop.searchPlaceholder : site.shop.searchPlaceholder },
    seo: site.seo.title ? site.seo : seed.seo,
  };
}
