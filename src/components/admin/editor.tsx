"use client";
/* eslint-disable @next/next/no-img-element -- avatar from Blob or any host */

import {
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  Palette,
  Settings,
  Share2,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { saveSite } from "@/app/admin/actions";
import { SiteView } from "@/components/site/site-view";
import type { Site } from "@/lib/types";
import { AnalyticsSection } from "./sections-analytics";
import { LinksSection } from "./sections-links";
import { ProfileSection, SocialsSection } from "./sections-profile";
import { SettingsSection } from "./sections-settings";
import { ShopSection } from "./sections-shop";
import { ThemeSection } from "./sections-theme";

const TABS = [
  { id: "profile", label: "Profile", icon: User, group: "Content", title: "Profile", blurb: "Your photo, name and the line under it." },
  { id: "socials", label: "Socials", icon: Share2, group: "Content", title: "Social icons", blurb: "The row of icons under your name." },
  { id: "links", label: "Links", icon: Link2, group: "Content", title: "Links", blurb: "Buttons and big image cards on the Links tab." },
  { id: "shop", label: "Shop", icon: ShoppingBag, group: "Content", title: "Shop", blurb: "Your affiliate products and collections." },
  { id: "theme", label: "Design", icon: Palette, group: "Look", title: "Design", blurb: "Colours, fonts and card style." },
  { id: "analytics", label: "Analytics", icon: BarChart3, group: "Insights", title: "Analytics", blurb: "Visitors, clicks and where people come from." },
  { id: "settings", label: "Settings", icon: Settings, group: "Insights", title: "Settings", blurb: "Search preview, backups and account." },
] as const;
type TabId = (typeof TABS)[number]["id"];
const GROUPS = ["Content", "Look", "Insights"] as const;

type Storage = { mode: string; writable: boolean; blob: boolean; analytics: boolean };

export function Editor({ initial, storage }: { initial: Site; storage: Storage }) {
  const [site, setSite] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [tab, setTab] = useState<TabId>("profile");
  const [showPreview, setShowPreview] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const dirty = useMemo(() => JSON.stringify(site) !== JSON.stringify(saved), [site, saved]);
  const update = useCallback((fn: (s: Site) => Site) => setSite(fn), []);
  const current = TABS.find((t) => t.id === tab)!;

  useEffect(() => {
    const h = window.location.hash.slice(1);
    // Read after hydration so server and client render the same first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (TABS.some((t) => t.id === h)) setTab(h as TabId);
  }, []);

  const save = useCallback(() => {
    startSaving(async () => {
      const res = await saveSite(site);
      if (res.ok) {
        setSaved(res.site);
        setSite(res.site);
        setStatus({ kind: "ok", text: "Saved. Your page is live." });
        setTimeout(() => setStatus(null), 2500);
      } else {
        setStatus({ kind: "error", text: res.error });
      }
    });
  }, [site]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty, saving, save]);

  const go = (id: TabId) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  };

  const props = { site, update };

  return (
    <div className="min-h-dvh bg-[#f6f6f4] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar site={site} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[14px] font-semibold">{site.profile.name || "Your page"}</div>
              <LiveLink />
            </div>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-100 lg:hidden"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="size-4" /> Preview
          </button>
          <a
            href="/"
            target="_blank"
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-100 sm:inline-flex"
          >
            <ExternalLink className="size-4" /> View page
          </a>
          {dirty ? (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:bg-zinc-500"
            >
              {saving && <Loader2 className="size-4 animate-spin" />} Save
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-emerald-700">
              <Check className="size-4" /> <span className="hidden sm:inline">All saved</span>
            </span>
          )}
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2.5 [mask-image:linear-gradient(to_right,black_85%,transparent)] lg:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${tab === t.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-8 px-4 py-6 lg:px-6 lg:py-8">
        <nav className="sticky top-24 hidden h-fit w-52 shrink-0 lg:block">
          {GROUPS.map((g) => (
            <div key={g} className="mb-5">
              <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{g}</div>
              {TABS.filter((t) => t.group === g).map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => go(t.id)}
                    className={`mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] font-medium transition ${active ? "bg-white text-zinc-900 shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-black/[0.06]" : "text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-900"}`}
                  >
                    <span className={`grid size-7 place-items-center rounded-lg ${active ? "bg-emerald-50 text-emerald-700" : "text-zinc-500"}`}>
                      <t.icon className="size-4" />
                    </span>
                    {t.label}
                    {t.id === "shop" && <Count n={site.products.filter((p) => p.enabled).length} />}
                    {t.id === "links" && <Count n={site.links.filter((l) => l.enabled).length} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1 pb-28">
          <div className="mx-auto max-w-2xl">
            <div className="mb-5">
              <h1 className="text-[22px] font-semibold tracking-tight">{current.title}</h1>
              <p className="mt-0.5 text-[14px] text-zinc-500">{current.blurb}</p>
            </div>
            {!storage.writable && (
              <div className="mb-5 rounded-2xl bg-amber-50 p-4 text-[13px] text-amber-900 ring-1 ring-amber-200">
                <b>Saving is off.</b> Connect a Blob store to this project in Vercel → Storage, then redeploy.
              </div>
            )}
            {tab === "profile" && <ProfileSection {...props} />}
            {tab === "socials" && <SocialsSection {...props} />}
            {tab === "links" && <LinksSection {...props} />}
            {tab === "shop" && <ShopSection {...props} />}
            {tab === "theme" && <ThemeSection {...props} />}
            {tab === "analytics" && <AnalyticsSection site={saved} enabled={storage.analytics} />}
            {tab === "settings" && <SettingsSection {...props} storage={storage} />}
          </div>
        </main>

        <aside className="sticky top-24 hidden h-[calc(100dvh-8rem)] w-[360px] shrink-0 lg:block">
          <PhoneFrame site={site} />
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/70 backdrop-blur-sm lg:hidden">
          <div className="flex items-center justify-between p-3 text-white">
            <span className="pl-2 text-[13px] font-medium">Preview</span>
            <button type="button" onClick={() => setShowPreview(false)} className="grid size-10 place-items-center rounded-full bg-white text-zinc-900" aria-label="Close preview">
              <X className="size-5" />
            </button>
          </div>
          <div className="mx-3 mb-3 min-h-0 flex-1 overflow-hidden rounded-[28px]" style={{ transform: "translateZ(0)" }}>
            <div className="h-full overflow-y-auto">
              <SiteView site={site} preview />
            </div>
          </div>
        </div>
      )}

      {(dirty || status) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-zinc-900/95 py-2 pl-4 pr-2 text-[13px] text-white shadow-[0_12px_40px_-8px_rgb(0_0_0/0.45)] ring-1 ring-white/10 backdrop-blur">
            {status ? (
              <span className={`flex items-center gap-1.5 ${status.kind === "error" ? "text-red-300" : "text-emerald-300"}`}>
                {status.kind === "ok" && <Check className="size-4" />} {status.text}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400" /> Unsaved changes
              </span>
            )}
            {dirty && (
              <>
                <button type="button" onClick={() => setSite(saved)} className="rounded-xl px-3 py-1.5 font-semibold text-zinc-300 hover:bg-white/10">
                  Discard
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 font-semibold text-zinc-900 hover:bg-zinc-200"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />} Save
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Count({ n }: { n: number }) {
  if (!n) return null;
  return <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-500">{n}</span>;
}

function Avatar({ site }: { site: Site }) {
  const [broken, setBroken] = useState(false);
  const url = site.profile.avatarUrl;
  if (url && !broken) {
    return <img src={url} alt="" onError={() => setBroken(true)} className="size-9 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm" />;
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-[13px] font-bold text-emerald-800">
      {(site.profile.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function LiveLink() {
  const [copied, setCopied] = useState(false);
  const [host, setHost] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- window is only available after mount
    setHost(window.location.host);
  }, []);
  if (!host) return <div className="h-4" />;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`https://${host}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="group flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-800"
      title="Copy your page link"
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      <span className="truncate">{host}</span>
      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3 opacity-0 transition group-hover:opacity-100" />}
    </button>
  );
}

function PhoneFrame({ site }: { site: Site }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-zinc-500">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Live preview
      </div>
      <div className="relative min-h-0 w-full max-w-[340px] flex-1 rounded-[46px] bg-zinc-950 p-[10px] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45)] ring-1 ring-black/10">
        <div className="absolute left-1/2 top-[18px] z-10 h-[22px] w-[90px] -translate-x-1/2 rounded-full bg-zinc-950" />
        <div className="no-scrollbar h-full overflow-y-auto overflow-x-hidden rounded-[36px] bg-white" style={{ transform: "translateZ(0)" }}>
          <SiteView site={site} preview />
        </div>
      </div>
    </div>
  );
}
