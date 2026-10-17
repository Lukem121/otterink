import { presetTheme } from "./themes";
import type { Site } from "./types";

export function defaultSite(): Site {
  return {
    profile: {
      name: "Your Name",
      tagline: "What you do, in one line",
      bio: "",
      avatarUrl: "",
    },
    socials: [
      { id: "s-ig", platform: "instagram", url: "https://instagram.com/", enabled: true },
      { id: "s-tt", platform: "tiktok", url: "https://tiktok.com/", enabled: true },
      { id: "s-yt", platform: "youtube", url: "https://youtube.com/", enabled: true },
      { id: "s-pin", platform: "pinterest", url: "https://pinterest.com/", enabled: true },
    ],
    links: [
      {
        id: "l-1",
        kind: "featured",
        title: "My latest project",
        subtitle: "Featured cards show a big image. Edit me in the admin.",
        url: "https://example.com",
        imageUrl: "",
        enabled: true,
        highlight: false,
      },
      {
        id: "l-2",
        kind: "link",
        title: "My website",
        subtitle: "",
        url: "https://example.com",
        imageUrl: "",
        enabled: true,
        highlight: true,
      },
      { id: "l-3", kind: "header", title: "Elsewhere", subtitle: "", url: "", imageUrl: "", enabled: true, highlight: false },
      {
        id: "l-4",
        kind: "link",
        title: "Newsletter",
        subtitle: "",
        url: "https://example.com",
        imageUrl: "",
        enabled: true,
        highlight: false,
      },
    ],
    products: [
      {
        id: "p-1",
        title: "Favourite marker set",
        url: "https://amazon.com/",
        imageUrl: "",
        price: "$24.99",
        badge: "Fave",
        description: "",
        enabled: true,
        showInGrid: true,
        collectionIds: ["c-1"],
      },
      {
        id: "p-2",
        title: "Desk lamp I use daily",
        url: "https://amazon.com/",
        imageUrl: "",
        price: "$39.00",
        badge: "",
        description: "",
        enabled: true,
        showInGrid: true,
        collectionIds: ["c-1"],
      },
      {
        id: "p-3",
        title: "Sketchbook",
        url: "https://amazon.com/",
        imageUrl: "",
        price: "$12.00",
        badge: "",
        description: "",
        enabled: true,
        showInGrid: true,
        collectionIds: ["c-1"],
      },
      {
        id: "p-4",
        title: "Cosy blanket",
        url: "https://amazon.com/",
        imageUrl: "",
        price: "$29.99",
        badge: "",
        description: "",
        enabled: true,
        showInGrid: true,
        collectionIds: [],
      },
    ],
    collections: [{ id: "c-1", title: "My art supplies", description: "", enabled: true }],
    shop: {
      enabled: true,
      linksLabel: "Links",
      shopLabel: "Shop",
      defaultTab: "links",
      showSearch: true,
      searchPlaceholder: "Search products",
      collectionsPosition: "bottom",
      disclosure: "As an Amazon Associate I earn from qualifying purchases.",
    },
    theme: presetTheme("mint"),
    seo: { title: "", description: "" },
    updatedAt: new Date(0).toISOString(),
  };
}

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
    links: (s.links ?? d.links).map((l) => ({ ...d.links[1], ...l })),
    products: (s.products ?? d.products).map((p) => ({ ...d.products[3], ...p })),
    collections: (s.collections ?? d.collections).map((c) => ({ ...d.collections[0], ...c })),
  };
}
