"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Database,
  Download,
  Eye,
  FolderOpen,
  Globe,
  Layers,
  Link2,
  Loader2,
  Monitor,
  MousePointerClick,
  Percent,
  RefreshCw,
  Search,
  Share2,
  ShoppingBag,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { exportAnalyticsCsv, getAnalyticsReport, resetAnalytics } from "@/app/admin/actions";
import { SOCIALS } from "@/components/site/social-icons";
import type { ItemKind, RangeDays, RecentEvent, Report } from "@/lib/analytics-types";
import type { Site } from "@/lib/types";
import { BLUE, Columns, Legend, ORANGE, Spark, TrendChart, compact, nf } from "./analytics-charts";
import { Button, Card, DeleteButton, EmptyState } from "./ui";

const RANGES: { days: RangeDays; label: string }[] = [
  { days: 1, label: "Today" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
];

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
const countryName = (cc: string) => {
  if (cc === "??") return "Unknown";
  try {
    return regionNames?.of(cc) ?? cc;
  } catch {
    return cc;
  }
};
const flag = (cc: string) =>
  /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : "🌐";

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "0%");

export function AnalyticsSection({ site, enabled }: { site: Site; enabled: boolean }) {
  const [days, setDays] = useState<RangeDays>(30);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    getAnalyticsReport(days, tz)
      .then((res) => {
        if (!live) return;
        if ("error" in res) setError(res.error);
        else {
          setReport(res.report);
          setError(null);
        }
      })
      .catch(() => live && setError("Couldn't load analytics. Try again."))
      .finally(() => live && setRefreshing(false));
    return () => {
      live = false;
    };
  }, [days, enabled, tick]);

  const names = useMemo(() => {
    const m = new Map<string, { title: string; kind: ItemKind }>();
    site.links.forEach((l) => m.set(l.id, { title: l.title || l.url, kind: l.kind === "featured" ? "featured" : "link" }));
    site.products.forEach((p) => m.set(p.id, { title: p.title || p.url, kind: "product" }));
    site.socials.forEach((s) => m.set(s.id, { title: SOCIALS[s.platform].label, kind: "social" }));
    site.collections.forEach((c) => m.set(c.id, { title: c.title, kind: "collection" }));
    return m;
  }, [site]);

  if (!enabled) return <SetupCard />;

  const loading = !report || report.days !== days;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-xl bg-white p-1 ring-1 ring-black/[0.08]" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${days === r.days ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setRefreshing(true);
              setTick((t) => t + 1);
            }}
            disabled={refreshing}
            title="Reload the numbers"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <ExportButton days={days} disabled={loading || !report?.totalEvents} />
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700 ring-1 ring-red-200">{error}</p>}

      {loading && !error ? (
        <div className="grid h-48 place-items-center">
          <Loader2 className="size-5 animate-spin text-zinc-400" />
        </div>
      ) : report ? (
        report.totalEvents === 0 ? (
          <EmptyState icon={<Eye className="size-5" />}>
            <b className="text-zinc-700">No visits recorded yet.</b>
            <br />
            Open your page on your phone and tap a few things. Events show up here within seconds.
            <br />
            Your own visits aren’t counted while you’re logged in to this admin.
          </EmptyState>
        ) : (
          <Dashboard report={report} names={names} site={site} />
        )
      ) : null}

      {report && report.totalEvents > 0 && <ResetCard onReset={() => setTick((t) => t + 1)} />}
    </div>
  );
}

function Dashboard({ report, names, site }: { report: Report; names: Map<string, { title: string; kind: ItemKind }>; site: Site }) {
  const t = report.totals;
  const p = report.prev;
  const spark = (key: "views" | "visitors" | "clicks") => report.daily.map((d) => d[key]);
  const today = report.bucket === "hour";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Users} label="Visitors" value={t.visitors} prev={p.visitors} spark={spark("visitors")} today={today} />
        <Stat icon={Eye} label="Page views" value={t.views} prev={p.views} spark={spark("views")} today={today} />
        <Stat icon={MousePointerClick} label="Clicks" value={t.clicks} prev={p.clicks} spark={spark("clicks")} today={today} />
        <Stat
          icon={Percent}
          label="Click rate"
          value={pct(t.clickers, t.visitors)}
          sub={`${nf.format(t.clickers)} of ${nf.format(t.visitors)} visitors clicked`}
        />
      </div>

      <TrendCard report={report} />

      <ClicksCard report={report} names={names} site={site} />

      <div className="grid gap-5 lg:grid-cols-2">
        <SourcesCard report={report} />
        <Card title="Where they’re from" description="Country of each visitor.">
          <List
            rows={report.countries.map((c) => ({
              key: c.country,
              label: `${flag(c.country)}  ${countryName(c.country)}`,
              value: c.visitors,
              note: c.clicks ? `${nf.format(c.clicks)} click${c.clicks === 1 ? "" : "s"}` : undefined,
            }))}
            empty="No location data yet. (It appears once the site is live on Vercel.)"
          />
          {report.cities.length > 0 && (
            <div className="mt-4 border-t border-black/[0.06] pt-4">
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Top cities</h3>
              <List rows={report.cities.map((c) => ({ key: c.city, label: c.city, value: c.visitors, note: c.country ? countryName(c.country) : undefined }))} />
            </div>
          )}
        </Card>
      </div>

      <Card title="Browsers" description="In-app browsers show where people opened your link, e.g. the Instagram app.">
        <List rows={report.browsers.map((d) => ({ key: d.label, label: d.label, value: d.n }))} total />
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card title="Devices">
          <List rows={report.devices.map((d) => ({ key: d.label, label: <DeviceLabel name={d.label} />, value: d.n }))} total />
        </Card>
        <Card title="Operating systems">
          <List rows={report.systems.map((d) => ({ key: d.label, label: d.label, value: d.n }))} total />
        </Card>
      </div>

      {report.bucket === "day" && <TimeCard report={report} />}

      <div className="grid gap-5 lg:grid-cols-2">
        <BehaviourCard report={report} />
        <Card title="What they search for" description="Shop search terms. A good source of ideas for what to add.">
          <List rows={report.searches.map((s) => ({ key: s.label, label: `“${s.label}”`, value: s.n, note: s.extra && s.extra !== s.n ? `${s.extra} people` : undefined }))} empty="Nobody has used the search bar yet." />
        </Card>
      </div>

      {report.campaigns.length > 0 && (
        <Card title="Campaigns" description="From ?utm_campaign= in the link you share.">
          <List rows={report.campaigns.map((c) => ({ key: c.campaign, label: c.campaign, value: c.views, note: `${nf.format(c.clicks)} click${c.clicks === 1 ? "" : "s"}` }))} />
        </Card>
      )}

      <Card title="Live activity" description="The latest 40 things people did.">
        <Feed events={report.recent} />
      </Card>
    </>
  );
}

/* ---------- pieces ---------- */

function Stat({
  icon: Icon, label, value, prev, spark, sub, today,
}: {
  icon: typeof Eye; label: string; value: number | string; prev?: number; spark?: number[]; sub?: string; today?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-black/[0.06]">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-500">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-zinc-900">
          {typeof value === "number" ? compact(value) : value}
        </div>
        {spark && <Spark values={spark} />}
      </div>
      <div className="mt-2 min-h-4 text-[12px] text-zinc-500">
        {typeof value === "number" && prev !== undefined ? <span title={today ? "Compared with yesterday up to the same time" : "Compared with the same point in the previous period"}><Delta cur={value} prev={prev} label={today ? "vs yesterday" : "vs prior"} /></span> : sub}
      </div>
    </div>
  );
}

function Delta({ cur, prev, label }: { cur: number; prev: number; label?: string }) {
  if (!prev && !cur) return <span>No activity yet</span>;
  if (!prev) return <span className="font-medium text-zinc-700">New</span>;
  const d = Math.round(((cur - prev) / prev) * 100);
  if (d === 0) return <span>No change{label ? ` ${label}` : ""}</span>;
  const up = d > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Icon className={`size-3.5 ${up ? "text-emerald-600" : "text-red-600"}`} aria-hidden />
      <span className="sr-only">{up ? "Up" : "Down"}</span>
      <span className="font-medium text-zinc-700">
        {up ? "+" : "−"}
        {Math.abs(d)}%
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

function TrendCard({ report }: { report: Report }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <Card
      title="Visits and clicks over time"
      actions={
        <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-0.5 text-[12px] font-semibold">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-2.5 py-1 capitalize ${view === v ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
            >
              {v}
            </button>
          ))}
        </div>
      }
    >
      {view === "chart" ? (
        <>
          <div className="mb-2">
            <Legend />
          </div>
          <TrendChart data={report.daily} />
        </>
      ) : (
        <div className="max-h-72 overflow-auto rounded-xl ring-1 ring-black/[0.06]">
          <table className="w-full text-left text-[13px] tabular-nums">
            <thead className="sticky top-0 bg-zinc-50 text-[12px] text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">{report.bucket === "hour" ? "Hour" : "Day"}</th>
                <th className="px-3 py-2 text-right font-medium">Visitors</th>
                <th className="px-3 py-2 text-right font-medium">Page views</th>
                <th className="px-3 py-2 text-right font-medium">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {[...report.daily].reverse().map((d) => (
                <tr key={d.day} className="border-t border-black/[0.05]">
                  <td className="px-3 py-1.5">{report.bucket === "hour" ? `${d.day.slice(11)}:00` : d.day}</td>
                  <td className="px-3 py-1.5 text-right">{nf.format(d.visitors)}</td>
                  <td className="px-3 py-1.5 text-right">{nf.format(d.views)}</td>
                  <td className="px-3 py-1.5 text-right">{nf.format(d.clicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const KIND_META: Record<string, { label: string; icon: typeof Link2 }> = {
  link: { label: "Link", icon: Link2 },
  featured: { label: "Featured", icon: Link2 },
  product: { label: "Product", icon: ShoppingBag },
  social: { label: "Social", icon: Share2 },
  collection: { label: "Collection", icon: FolderOpen },
};

function ClicksCard({ report, names, site }: { report: Report; names: Map<string, { title: string; kind: ItemKind }>; site: Site }) {
  const [filter, setFilter] = useState<"all" | "links" | "products" | "socials">("all");
  const [showAll, setShowAll] = useState(false);

  const rows = report.items.filter((r) => {
    const kind = names.get(r.id)?.kind ?? r.kind;
    if (filter === "all") return true;
    if (filter === "links") return kind === "link" || kind === "featured";
    if (filter === "products") return kind === "product";
    return kind === "social";
  });
  const shown = showAll ? rows : rows.slice(0, 10);
  const max = Math.max(1, ...rows.map((r) => r.clicks));

  const clicked = new Set(report.items.map((r) => r.id));
  const unclicked = [
    ...site.links.filter((l) => l.enabled && l.kind !== "header" && l.url).map((l) => ({ id: l.id, title: l.title || l.url })),
    ...site.products.filter((p) => p.enabled && p.title).map((p) => ({ id: p.id, title: p.title })),
  ].filter((i) => !clicked.has(i.id));

  return (
    <Card
      title="What people click"
      description={`Every link, product and social icon, most clicked first. Click rate = share of ${nf.format(report.totals.views)} page views.`}
      actions={
        <div className="hidden gap-1 rounded-lg bg-zinc-100 p-0.5 text-[12px] font-semibold sm:inline-flex">
          {(["all", "links", "products", "socials"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 capitalize ${filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="text-[13px] text-zinc-500">No clicks in this period{filter === "all" ? "." : " for this type."}</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((r, i) => {
            const meta = KIND_META[names.get(r.id)?.kind ?? r.kind ?? "link"] ?? KIND_META.link;
            const removed = !names.has(r.id);
            const title = names.get(r.id)?.title ?? r.title;
            const host = hostOf(r.url);
            return (
              <li key={r.id} className="relative overflow-hidden rounded-xl bg-zinc-50 px-3 py-2.5">
                <div className="absolute inset-y-0 left-0 bg-[#cde2fb]/70" style={{ width: `${(r.clicks / max) * 100}%` }} />
                <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-5 shrink-0 text-center text-[12px] font-semibold tabular-nums text-zinc-400">{i + 1}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-zinc-900">
                        {title}
                        {removed && <span className="ml-1.5 text-[11px] font-normal text-zinc-400">(removed)</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <meta.icon className="size-3" /> {meta.label}
                        {host && <span className="truncate">· {host}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-7 text-[12px] text-zinc-500 tabular-nums sm:pl-0">
                    <span title="Share of page views that clicked this">{pct(r.clicks, report.totals.views)}</span>
                    <span>{nf.format(r.visitors)} {r.visitors === 1 ? "person" : "people"}</span>
                    <span className="hidden min-w-[96px] sm:block">
                      <Delta cur={r.clicks} prev={r.prevClicks} />
                    </span>
                    <span className="min-w-8 text-right text-[16px] font-semibold text-zinc-900">{nf.format(r.clicks)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > 10 && (
        <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-3 text-[13px] font-semibold text-zinc-600 hover:text-zinc-900">
          {showAll ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
      {unclicked.length > 0 && filter === "all" && (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 px-3.5 py-3 text-[13px] text-zinc-600">
          <b className="text-zinc-800">{unclicked.length} item{unclicked.length === 1 ? "" : "s"} with no clicks</b> in this period:{" "}
          {unclicked.slice(0, 6).map((u) => u.title).join(", ")}
          {unclicked.length > 6 ? ` and ${unclicked.length - 6} more` : ""}.
        </div>
      )}
    </Card>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const sourceName = (source: string) =>
  (SOCIALS as Record<string, { label: string }>)[source]?.label ?? source.charAt(0).toUpperCase() + source.slice(1);

function SourceIcon({ source }: { source: string }) {
  const known = (SOCIALS as Record<string, (typeof SOCIALS)[keyof typeof SOCIALS]>)[source];
  if (known) return <known.icon className="size-4 shrink-0 text-zinc-500" aria-hidden />;
  return <Globe className="size-4 shrink-0 text-zinc-500" aria-hidden />;
}

function SourcesCard({ report }: { report: Report }) {
  const max = Math.max(1, ...report.sources.map((s) => s.visitors));
  return (
    <Card title="Where visitors come from" description="Which source brings people who actually click.">
      <ul className="space-y-2">
        {report.sources.map((s) => (
          <li key={s.source} className="relative overflow-hidden rounded-xl bg-zinc-50 px-3 py-2">
            <div className="absolute inset-y-0 left-0 bg-[#cde2fb]/70" style={{ width: `${(s.visitors / max) * 100}%` }} />
            <div className="relative flex items-center justify-between gap-3 text-[13px]">
              <span className="flex min-w-0 items-center gap-2 font-medium text-zinc-900">
                <SourceIcon source={s.source} />
                <span className="truncate">{sourceName(s.source)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3 tabular-nums text-zinc-500">
                <span title="Share of these visitors who clicked something">{pct(s.clickers, s.visitors)} clicked</span>
                <span className="min-w-8 text-right font-semibold text-zinc-900">{nf.format(s.visitors)}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      {report.referrers.length > 0 && (
        <div className="mt-4 border-t border-black/[0.06] pt-4">
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Referring sites</h3>
          <List rows={report.referrers.map((r) => ({ key: r.label, label: r.label, value: r.n }))} />
        </div>
      )}
      <p className="mt-3 text-[12px] text-zinc-500">
        Tip: add <code className="rounded bg-zinc-100 px-1">?utm_source=instagram</code> to the link in each bio so nothing shows as “direct”.
      </p>
    </Card>
  );
}

function DeviceLabel({ name }: { name: string }) {
  const Icon = name === "mobile" ? Smartphone : name === "tablet" ? Tablet : Monitor;
  return (
    <span className="flex items-center gap-2 capitalize">
      <Icon className="size-4 text-zinc-500" aria-hidden /> {name}
    </span>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => `${h}`);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

function TimeCard({ report }: { report: Report }) {
  const [metric, setMetric] = useState<"views" | "clicks">("views");
  const color = metric === "views" ? BLUE : ORANGE;
  const word = metric === "views" ? "page views" : "clicks";
  const hours = report.hourly.map((h) => h[metric]);
  const week = report.weekday.map((h) => h[metric]);
  const best = hours.indexOf(Math.max(...hours));
  return (
    <Card
      title="When people visit"
      description={`In your time zone (${report.tz.replace("_", " ")}).`}
      actions={
        <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-0.5 text-[12px] font-semibold">
          {(["views", "clicks"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`rounded-md px-2.5 py-1 ${metric === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
            >
              {m === "views" ? "Page views" : "Clicks"}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Hour of day</h3>
          <Columns values={hours} labels={HOURS} color={color} labelEvery={3} tip={(i, v) => `${hh(i)}–${hh((i + 1) % 24)} · ${nf.format(v)} ${word}`} />
          {hours[best] > 0 && <p className="mt-2 text-[12px] text-zinc-500">Busiest hour: {hh(best)}.</p>}
        </div>
        <div>
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Day of week</h3>
          <Columns values={week} labels={DAYS.map((d) => d[0])} color={color} tip={(i, v) => `${DAYS[i]} · ${nf.format(v)} ${word}`} />
        </div>
      </div>
    </Card>
  );
}

function BehaviourCard({ report }: { report: Report }) {
  const tabs = report.tabs;
  const tabsTotal = tabs.reduce((s, t) => s + t.n, 0);
  return (
    <Card title="How they use the page">
      <div className="space-y-4 text-[13px]">
        <div>
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Tab switches</h3>
          <List rows={tabs.map((t) => ({ key: t.label, label: t.label === "shop" ? "Opened the Shop tab" : "Opened the Links tab", value: t.n }))} empty="No tab switches yet." />
          {tabsTotal > 0 && <p className="mt-1 text-[12px] text-zinc-500">{pct(tabs.find((t) => t.label === "shop")?.n ?? 0, report.totals.visitors)} of visitors opened the shop.</p>}
        </div>
        <div>
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">Collections opened</h3>
          <List rows={report.collections.map((c) => ({ key: c.label, label: c.label, value: c.n }))} empty="No collections opened yet." />
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-zinc-700">
          <Share2 className="size-4 text-zinc-500" aria-hidden />
          <span>
            <b className="tabular-nums">{nf.format(report.shares)}</b> share{report.shares === 1 ? "" : "s"} or link copies
          </span>
        </div>
      </div>
    </Card>
  );
}

/** Ranked list with a soft bar behind each row. */
function List({
  rows, empty, total,
}: {
  rows: { key: string; label: ReactNode; value: number; note?: string }[];
  empty?: string;
  total?: boolean;
}) {
  if (rows.length === 0) return <p className="text-[13px] text-zinc-500">{empty ?? "Nothing yet."}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const sum = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.key} className="relative overflow-hidden rounded-lg bg-zinc-50 px-3 py-1.5">
          <div className="absolute inset-y-0 left-0 bg-[#cde2fb]/70" style={{ width: `${(r.value / max) * 100}%` }} />
          <div className="relative flex items-center justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate font-medium text-zinc-800">{r.label}</span>
            <span className="flex shrink-0 items-center gap-2.5 tabular-nums">
              {r.note && <span className="text-[12px] text-zinc-500">{r.note}</span>}
              {total && <span className="text-[12px] text-zinc-500">{pct(r.value, sum)}</span>}
              <span className="min-w-6 text-right font-semibold text-zinc-900">{nf.format(r.value)}</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const EVENT_META: Record<string, { icon: typeof Eye; verb: string }> = {
  view: { icon: Eye, verb: "Visited your page" },
  click: { icon: MousePointerClick, verb: "Clicked" },
  tab: { icon: Layers, verb: "Opened the" },
  collection: { icon: FolderOpen, verb: "Opened collection" },
  search: { icon: Search, verb: "Searched for" },
  share: { icon: Share2, verb: "Shared" },
};

function ago(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 45) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

function Feed({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) return <p className="text-[13px] text-zinc-500">Nothing yet.</p>;
  return (
    <ul className="divide-y divide-black/[0.05]">
      {events.map((e, i) => {
        const meta = EVENT_META[e.type] ?? EVENT_META.view;
        const what =
          e.type === "search" ? `“${e.query}”` : e.type === "tab" ? `${e.title ?? "other"} tab` : (e.title ?? "");
        return (
          <li key={`${e.ts}-${i}`} className="flex items-center gap-3 py-2 text-[13px]">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500">
              <meta.icon className="size-3.5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate text-zinc-800">
              <span className="text-zinc-500">{meta.verb}</span> <span className="font-medium">{what}</span>
            </span>
            <span className="hidden shrink-0 items-center gap-2 text-[12px] text-zinc-500 sm:flex">
              {e.source && <span className="rounded-md bg-zinc-100 px-1.5 py-0.5">{sourceName(e.source)}</span>}
              {e.country && <span title={countryName(e.country)}>{flag(e.country)}</span>}
              {e.device && <span className="capitalize">{e.device}</span>}
            </span>
            <span className="w-14 shrink-0 text-right text-[12px] text-zinc-400">{ago(e.ts)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ExportButton({ days, disabled }: { days: RangeDays; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async () => {
    setBusy(true);
    try {
      const res = await exportAnalyticsCsv(days, Intl.DateTimeFormat().resolvedOptions().timeZone);
      if ("csv" in res) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([res.csv], { type: "text/csv" }));
        a.download = `analytics-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } finally {
      setBusy(false);
    }
  }, [days]);
  return (
    <Button onClick={run} disabled={disabled || busy} title="Download every event as a spreadsheet file">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export CSV
    </Button>
  );
}

function ResetCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-[13px] text-zinc-600">
      <span>Testing things out? You can wipe all analytics data and start fresh.</span>
      <DeleteButton
        label="Reset analytics"
        onConfirm={async () => {
          await resetAnalytics();
          onReset();
        }}
      />
    </div>
  );
}

function SetupCard() {
  return (
    <Card>
      <div className="flex gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-200">
          <Database className="size-5" />
        </span>
        <div className="text-[14px] text-zinc-700">
          <h2 className="text-[15px] font-semibold text-zinc-900">Connect a Postgres database to turn analytics on</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              In Vercel, open this project → <b>Storage</b> → <b>Create Database</b> → <b>Neon (Postgres)</b>. The free plan is plenty.
            </li>
            <li>Connect it to this project (leave the defaults).</li>
            <li>
              <b>Redeploy</b> (Deployments → ⋯ → Redeploy). The table is created automatically.
            </li>
          </ol>
          <p className="mt-3 text-[13px] text-zinc-500">
            It records visits, every click, searches, tab switches, device, country and where people came from, with no cookies and no IP addresses stored.
          </p>
        </div>
      </div>
    </Card>
  );
}
