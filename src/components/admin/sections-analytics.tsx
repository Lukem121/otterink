"use client";

import { Loader2, MousePointerClick, Eye, Percent } from "lucide-react";
import { useEffect, useState } from "react";
import { getAnalytics } from "@/app/admin/actions";
import { SOCIALS } from "@/components/site/social-icons";
import type { Analytics, Site } from "@/lib/types";
import { Card } from "./ui";

const RANGES = [7, 30, 90] as const;

export function AnalyticsSection({ site, enabled }: { site: Site; enabled: boolean }) {
  const [range, setRange] = useState<number>(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getAnalytics(range)
      .then((d) => live && (setData(d), setError(null)))
      .catch(() => live && setError("Couldn't load analytics."));
    return () => {
      live = false;
    };
  }, [range]);

  const names = new Map<string, { name: string; kind: string }>();
  site.links.forEach((l) => names.set(l.id, { name: l.title || l.url, kind: "Link" }));
  site.products.forEach((p) => names.set(p.id, { name: p.title || p.url, kind: "Product" }));
  site.socials.forEach((s) => names.set(s.id, { name: SOCIALS[s.platform].label, kind: "Social" }));

  const max = data ? Math.max(1, ...data.days.map((d) => d.views)) : 1;
  const ctr = data && data.totals.views ? Math.round((data.totals.clicks / data.totals.views) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-zinc-900">Analytics</h2>
        <div className="inline-flex gap-1 rounded-xl bg-white p-1 ring-1 ring-zinc-200">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${range === r ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {!enabled && (
        <div className="rounded-2xl bg-sky-50 p-4 text-[13px] leading-relaxed text-sky-900 ring-1 ring-sky-200">
          <b>Analytics is off.</b> To turn it on: in Vercel, open this project → <b>Storage</b> → <b>Create Database</b> →{" "}
          <b>Upstash for Redis</b> (free) → connect it to this project, then redeploy.
        </div>
      )}
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      {!data ? (
        <div className="grid h-40 place-items-center">
          <Loader2 className="size-5 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={Eye} label="Visitors" value={data.totals.views} />
            <Stat icon={MousePointerClick} label="Clicks" value={data.totals.clicks} />
            <Stat icon={Percent} label="Click rate" value={`${ctr}%`} />
          </div>

          <Card title="Visitors per day">
            <div className="flex h-36 items-end gap-[2px]">
              {data.days.map((d) => (
                <div key={d.day} className="group relative flex h-full flex-1 items-end">
                  <div className="w-full rounded-t bg-emerald-400 transition group-hover:bg-emerald-600" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 3 : 1 }} />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white group-hover:block">
                    {d.day}: {d.views} views, {d.clicks} clicks
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
              <span>{data.days[0]?.day}</span>
              <span>{data.days.at(-1)?.day}</span>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Top clicks">
              {data.items.length === 0 ? (
                <p className="text-[13px] text-zinc-500">No clicks yet.</p>
              ) : (
                <Bars rows={data.items.slice(0, 15).map((i) => ({ label: names.get(i.id)?.name ?? "Deleted item", sub: names.get(i.id)?.kind ?? "", value: i.clicks }))} />
              )}
            </Card>
            <Card title="Where visitors come from" description="From the referrer or a ?utm_source= tag on your link.">
              {data.sources.length === 0 ? (
                <p className="text-[13px] text-zinc-500">No visits yet.</p>
              ) : (
                <Bars rows={data.sources.slice(0, 12).map((s) => ({ label: s.source, sub: "", value: s.views }))} />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-500">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; sub: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="relative overflow-hidden rounded-lg bg-zinc-50 px-3 py-2">
          <div className="absolute inset-y-0 left-0 bg-emerald-100" style={{ width: `${(r.value / max) * 100}%` }} />
          <div className="relative flex items-center justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate font-medium text-zinc-800">
              {r.label}
              {r.sub && <span className="ml-1.5 text-[11px] font-normal text-zinc-500">{r.sub}</span>}
            </span>
            <span className="font-semibold tabular-nums text-zinc-900">{r.value.toLocaleString()}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
