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
      product("p-1", "Alcohol Markers", "https://link.amazon/B0efZER2R"),
      product("p-2", "Cozy Vibes", "https://link.amazon/B0jm2AVER"),
      product("p-3", "Girl Moments", "https://link.amazon/B0fxRqfmU"),
      product("p-4", "Spooky Cutie", "https://link.amazon/B04s9u0er"),
      product("p-5", "Cozy Season", "https://link.amazon/B04YpSyJi"),
      product("p-6", "Cozy Capybara", "https://link.amazon/B0gtAzcv1"),
      product("p-7", "Cozy Corner", "https://link.amazon/B00UNORrh"),
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
      disclosure: "As an Amazon Associate I earn from qualifying purchases.",
    },
    theme: presetTheme("mint"),
    seo: { title: "Otter.inkk", description: "Cozy coloring books and the art supplies I use." },
    updatedAt: new Date(0).toISOString(),
  };
}

function product(id: string, title: string, url: string): Product {
  return {
    id,
    title,
    url,
    imageUrl: "",
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
export function normalizeSite(raw: unknown): Site {
  const d = defaultSite();
  const s = (raw ?? {}) as Partial<Site>;
  return {
    ...d,
    ...s,
    profile: { ...d.profile, ...s.profile },
    shop: { ...d.shop, ...s.shop },
    theme: { ...d.theme, ...s.theme },
    seo: { ...d.seo, ...s.seo },
    socials: s.socials ?? d.socials,
    links: (s.links ?? d.links).map((l) => ({ ...BLANK_LINK, ...l })),
    products: (s.products ?? d.products).map((p) => ({ ...BLANK_PRODUCT, ...p })),
    collections: (s.collections ?? d.collections).map((c) => ({ ...BLANK_COLLECTION, ...c })),
  };
}
