/** Shared between the tracking endpoint, the report query and the admin dashboard. */

export const EVENT_TYPES = ["view", "click", "tab", "collection", "search", "share"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const ITEM_KINDS = ["link", "featured", "product", "social", "collection", "tab", "page"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export type RangeDays = 7 | 30 | 90 | 365;

export type Totals = { views: number; visitors: number; clicks: number; clickers: number };

export type DayPoint = { day: string; views: number; visitors: number; clicks: number };

export type ItemRow = {
  id: string;
  kind: ItemKind | null;
  title: string;
  url: string;
  clicks: number;
  visitors: number;
  prevClicks: number;
};

export type SourceRow = { source: string; visitors: number; views: number; clicks: number; clickers: number };
export type CountRow = { label: string; n: number; extra?: number };

export type RecentEvent = {
  ts: number;
  type: EventType;
  kind: ItemKind | null;
  title: string | null;
  query: string | null;
  source: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
};

export type Report = {
  days: number;
  from: string;
  to: string;
  tz: string;
  totals: Totals;
  prev: Totals;
  daily: DayPoint[];
  items: ItemRow[];
  sources: SourceRow[];
  referrers: CountRow[];
  campaigns: { campaign: string; views: number; clicks: number }[];
  countries: { country: string; visitors: number; clicks: number }[];
  cities: { city: string; country: string | null; visitors: number }[];
  devices: CountRow[];
  browsers: CountRow[];
  systems: CountRow[];
  hourly: { views: number; clicks: number }[];
  weekday: { views: number; clicks: number }[];
  searches: CountRow[];
  tabs: CountRow[];
  collections: CountRow[];
  shares: number;
  recent: RecentEvent[];
  totalEvents: number;
};
