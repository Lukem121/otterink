import { z } from "zod";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "pinterest",
  "x",
  "threads",
  "twitch",
  "discord",
  "spotify",
  "snapchat",
  "linkedin",
  "github",
  "etsy",
  "amazon",
  "patreon",
  "kofi",
  "substack",
  "bluesky",
  "whatsapp",
  "telegram",
  "website",
  "email",
] as const;

export const FONTS = [
  "andika",
  "nunito",
  "quicksand",
  "fredoka",
  "poppins",
  "inter",
  "dm-sans",
  "space-grotesk",
  "playfair",
  "dm-serif",
  "caveat",
] as const;

const id = z.string().min(1).max(64);
const url = z.string().max(2048);
const text = (max: number) => z.string().max(max);

export const SocialSchema = z.object({
  id,
  platform: z.enum(SOCIAL_PLATFORMS),
  url,
  enabled: z.boolean(),
});

export const LinkSchema = z.object({
  id,
  kind: z.enum(["link", "featured", "header"]),
  title: text(200),
  subtitle: text(300),
  url,
  imageUrl: url,
  enabled: z.boolean(),
  highlight: z.boolean(),
});

export const ProductSchema = z.object({
  id,
  title: text(200),
  url,
  imageUrl: url,
  price: text(40),
  badge: text(40),
  description: text(500),
  enabled: z.boolean(),
  showInGrid: z.boolean(),
  collectionIds: z.array(id).max(100),
});

export const CollectionSchema = z.object({
  id,
  title: text(120),
  description: text(300),
  enabled: z.boolean(),
});

export const ThemeSchema = z.object({
  preset: text(40),
  bgType: z.enum(["gradient", "solid", "image"]),
  bgFrom: text(32),
  bgTo: text(32),
  bgImageUrl: url,
  wave: z.boolean(),
  text: text(32),
  muted: text(32),
  cardBg: text(32),
  cardText: text(32),
  accent: text(32),
  accentText: text(32),
  font: z.enum(FONTS),
  headingFont: z.enum(FONTS),
  radius: z.number().min(0).max(40),
  buttonStyle: z.enum(["soft", "filled", "outline", "glass", "pop"]),
  shadow: z.boolean(),
  /** Name, section headers and social icons. */
  headingColor: text(32),
  pattern: z.enum(["none", "daisies", "dots"]),
  headerAlign: z.enum(["center", "left"]),
});

export const SiteSchema = z.object({
  profile: z.object({
    name: text(80),
    tagline: text(120),
    bio: text(500),
    avatarUrl: url,
  }),
  socials: z.array(SocialSchema).max(40),
  links: z.array(LinkSchema).max(200),
  products: z.array(ProductSchema).max(500),
  collections: z.array(CollectionSchema).max(100),
  shop: z.object({
    enabled: z.boolean(),
    linksLabel: text(30),
    shopLabel: text(30),
    defaultTab: z.enum(["links", "shop"]),
    showSearch: z.boolean(),
    searchPlaceholder: text(80),
    collectionsPosition: z.enum(["top", "bottom"]),
    disclosure: text(400),
    /** Text of the button on product cards; empty hides it. */
    buyLabel: text(30),
  }),
  theme: ThemeSchema,
  seo: z.object({
    title: text(120),
    description: text(300),
  }),
  updatedAt: z.string().max(40),
});

export type Social = z.infer<typeof SocialSchema>;
export type SocialPlatform = Social["platform"];
export type LinkItem = z.infer<typeof LinkSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type FontKey = Theme["font"];
export type Site = z.infer<typeof SiteSchema>;

export type DayStat = { day: string; views: number; clicks: number };
export type Analytics = {
  days: DayStat[];
  totals: { views: number; clicks: number };
  items: { id: string; clicks: number }[];
  sources: { source: string; views: number }[];
};
