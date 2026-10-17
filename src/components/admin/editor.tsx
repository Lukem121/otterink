"use client";

import { BarChart3, ExternalLink, Eye, Link2, Loader2, Palette, Settings, Share2, ShoppingBag, User, X } from "lucide-react";
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
import { Button } from "./ui";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "socials", label: "Socials", icon: Share2 },
  { id: "links", label: "Links", icon: Link2 },
  { id: "shop", label: "Shop", icon: ShoppingBag },
  { id: "theme", label: "Design", icon: Palette },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;
type TabId = (typeof TABS)[number]["id"];

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
    <div className="min-h-dvh bg-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
          <div className="text-[15px] font-bold tracking-tight text-zinc-900">Link page</div>
          <div className="flex-1" />
          <Button variant="ghost" className="lg:hidden" onClick={() => setShowPreview(true)}>
            <Eye className="size-4" /> Preview
          </Button>
          <a
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-zinc-600 hover:bg-zinc-100"
          >
            <ExternalLink className="size-4" /> <span className="hidden sm:inline">View page</span>
          </a>
          <Button variant="primary" onClick={save} disabled={!dirty || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {dirty ? "Save" : "Saved"}
          </Button>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${tab === t.id ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <nav className="sticky top-20 hidden h-fit w-48 shrink-0 flex-col gap-1 lg:flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.id)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition ${tab === t.id ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200" : "text-zinc-600 hover:bg-white/60"}`}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 pb-28">
          <div className="mx-auto max-w-2xl">
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

        <aside className="sticky top-20 hidden h-[calc(100dvh-6.5rem)] w-[380px] shrink-0 lg:block">
          <PhoneFrame site={site} />
        </aside>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-900/60 backdrop-blur-sm lg:hidden">
          <div className="flex justify-end p-3">
            <button type="button" onClick={() => setShowPreview(false)} className="grid size-10 place-items-center rounded-full bg-white" aria-label="Close preview">
              <X className="size-5" />
            </button>
          </div>
          <div className="mx-3 mb-3 min-h-0 flex-1 overflow-hidden rounded-3xl" style={{ transform: "translateZ(0)" }}>
            <div className="h-full overflow-y-auto">
              <SiteView site={site} preview />
            </div>
          </div>
        </div>
      )}

      {(dirty || status) && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 py-2 pl-4 pr-2 text-[13px] text-white shadow-2xl">
            {status ? (
              <span className={status.kind === "error" ? "text-red-300" : "text-emerald-300"}>{status.text}</span>
            ) : (
              <span>Unsaved changes</span>
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

function PhoneFrame({ site }: { site: Site }) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="mb-2 text-[12px] font-medium text-zinc-500">Live preview</div>
      <div className="relative min-h-0 w-full max-w-[360px] flex-1 rounded-[44px] bg-zinc-900 p-3 shadow-2xl">
        <div className="absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
        <div className="no-scrollbar h-full overflow-y-auto overflow-x-hidden rounded-[34px] bg-white" style={{ transform: "translateZ(0)" }}>
          <SiteView site={site} preview />
        </div>
      </div>
    </div>
  );
}
