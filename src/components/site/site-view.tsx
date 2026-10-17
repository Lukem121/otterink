"use client";
/* eslint-disable @next/next/no-img-element -- images come from Blob or any affiliate host */

import { ArrowLeft, Check, Copy, MoreVertical, Search, Share2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { fontVar } from "@/lib/themes";
import type { Collection, LinkItem, Product, Site } from "@/lib/types";
import { SOCIALS } from "./social-icons";

type Tab = "links" | "shop";

type Props = {
  site: Site;
  /** Admin live preview: no analytics, links don't navigate. */
  preview?: boolean;
};

export function SiteView({ site, preview = false }: Props) {
  const { profile, theme, shop } = site;
  const products = useMemo(() => site.products.filter((p) => p.enabled && p.title), [site.products]);
  const collections = useMemo(
    () => site.collections.filter((c) => c.enabled && products.some((p) => p.collectionIds.includes(c.id))),
    [site.collections, products],
  );
  const links = site.links.filter((l) => l.enabled && (l.kind === "header" ? l.title : l.url));
  const socials = site.socials.filter((s) => s.enabled && s.url);
  const shopOn = shop.enabled && products.length > 0;

  const [tab, setTab] = useState<Tab>(shopOn ? shop.defaultTab : "links");
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const activeTab: Tab = shopOn ? tab : "links";

  // Deep links: #shop, #links, #shop/<collection-id>
  useEffect(() => {
    if (preview) return;
    const apply = () => {
      const [t, c] = window.location.hash.slice(1).split("/");
      if (t === "shop" || t === "links") setTab(t);
      setOpenCollection(t === "shop" && c ? c : null);
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [preview]);

  // Page view analytics, once per browser session.
  useEffect(() => {
    if (preview) return;
    try {
      if (sessionStorage.getItem("lp-viewed")) return;
      sessionStorage.setItem("lp-viewed", "1");
    } catch {}
    const params = new URLSearchParams(window.location.search);
    let src = params.get("utm_source") || "";
    if (!src && document.referrer) {
      try {
        const host = new URL(document.referrer).hostname.replace(/^(www|m|l|lm|out)\./, "");
        if (host !== window.location.hostname) src = host.split(".").slice(-2, -1)[0] || host;
      } catch {}
    }
    beacon({ t: "view", src: src || "direct" });
  }, [preview]);

  const navigate = useCallback(
    (t: Tab, collection: string | null = null) => {
      setTab(t);
      setOpenCollection(collection);
      setQuery("");
      if (!preview) history.pushState(null, "", `#${t}${collection ? `/${collection}` : ""}`);
    },
    [preview],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const onItemClick = (id: string) => (e: MouseEvent) => {
    if (preview) {
      e.preventDefault();
      return;
    }
    beacon({ t: "click", id });
  };

  const sharePage = () => share(profile.name, window.location.href.split("#")[0], showToast);

  const style = {
    "--lp-text": theme.text,
    "--lp-muted": theme.muted,
    "--lp-card": theme.cardBg,
    "--lp-card-text": theme.cardText,
    "--lp-accent": theme.accent,
    "--lp-accent-text": theme.accentText,
    "--lp-radius": `${theme.radius}px`,
    "--lp-font": fontVar(theme.font),
    "--lp-heading": fontVar(theme.headingFont),
  } as CSSProperties;

  const background: CSSProperties =
    theme.bgType === "image" && theme.bgImageUrl
      ? { backgroundImage: `url("${theme.bgImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
      : theme.bgType === "solid"
        ? { background: theme.bgFrom }
        : { background: `linear-gradient(180deg, ${theme.bgFrom} 0%, ${theme.bgTo} 70%)` };

  const collection = openCollection ? collections.find((c) => c.id === openCollection) : undefined;

  return (
    <div
      className={`lp-root relative isolate ${preview ? "min-h-full" : "min-h-dvh"} lp-btn-${theme.buttonStyle} ${theme.shadow ? "lp-shadow" : ""}`}
      style={style}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden" style={background} aria-hidden>
        {theme.bgType === "image" && theme.bgImageUrl && <div className="absolute inset-0 bg-black/25" />}
        {theme.wave && theme.bgType !== "image" && (
          <div className="absolute inset-x-0 bottom-0 top-[200px] flex flex-col opacity-75">
            <svg className="h-[160px] w-full shrink-0" viewBox="0 0 400 160" preserveAspectRatio="none">
              <path d="M0 90 C 120 30, 260 150, 400 60 L 400 161 L 0 161 Z" fill={theme.bgTo} />
            </svg>
            <div className="-mt-px flex-1" style={{ background: theme.bgTo }} />
          </div>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-[580px] flex-col px-4 pb-10 pt-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={sharePage}
            aria-label="Share this page"
            className="grid size-10 place-items-center rounded-full bg-white/70 text-neutral-800 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <Share2 className="size-[18px]" />
          </button>
        </div>

        <header className="lp-enter flex flex-col items-center pt-2 text-center">
          <Avatar url={profile.avatarUrl} name={profile.name} />
          <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight">{profile.name}</h1>
          {profile.tagline && <p className="mt-1 text-[17px] opacity-90">{profile.tagline}</p>}
          {profile.bio && (
            <p className="mt-3 max-w-[440px] whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "var(--lp-muted)" }}>
              {profile.bio}
            </p>
          )}
          {socials.length > 0 && (
            <nav className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-3" aria-label="Social links">
              {socials.map((s) => {
                const { icon: Icon, label } = SOCIALS[s.platform];
                return (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    onClick={onItemClick(s.id)}
                    className="transition hover:-translate-y-0.5 hover:opacity-80"
                  >
                    <Icon className="size-[30px]" />
                  </a>
                );
              })}
            </nav>
          )}
        </header>

        {shopOn && (
          <div className="mt-7 flex justify-center">
            <div
              role="tablist"
              className="relative grid grid-cols-2 rounded-full p-1"
              style={{ background: "color-mix(in srgb, var(--lp-text) 55%, transparent)" }}
            >
              <span
                aria-hidden
                className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out"
                style={{
                  background: "var(--lp-card)",
                  transform: activeTab === "shop" ? "translateX(100%)" : "none",
                  boxShadow: "0 2px 8px rgb(0 0 0 / 0.15)",
                }}
              />
              {(["links", "shop"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === t}
                  onClick={() => navigate(t)}
                  className="relative z-10 min-w-[104px] rounded-full px-6 py-2.5 text-[16px] font-semibold transition-colors"
                  style={{ color: activeTab === t ? "var(--lp-card-text)" : "rgb(255 255 255 / 0.92)" }}
                >
                  {t === "links" ? shop.linksLabel : shop.shopLabel}
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="mt-7">
          {activeTab === "links" ? (
            <LinksList links={links} onItemClick={onItemClick} onToast={showToast} />
          ) : collection ? (
            <CollectionView
              collection={collection}
              products={products.filter((p) => p.collectionIds.includes(collection.id))}
              onBack={() => navigate("shop")}
              onItemClick={onItemClick}
              onToast={showToast}
            />
          ) : (
            <ShopView
              site={site}
              products={products}
              collections={collections}
              query={query}
              setQuery={setQuery}
              onOpenCollection={(id) => navigate("shop", id)}
              onItemClick={onItemClick}
              onToast={showToast}
            />
          )}
        </main>

        {activeTab === "shop" && shop.disclosure && (
          <p className="mt-8 text-center text-xs leading-relaxed" style={{ color: "var(--lp-muted)" }}>
            {shop.disclosure}
          </p>
        )}
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            <Check className="size-4" /> {toast}
          </div>
        </div>
      )}
    </div>
  );
}

type ItemClick = (id: string) => (e: MouseEvent) => void;

function Avatar({ url, name }: { url: string; name: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="size-[104px] rounded-full object-cover shadow-md ring-4 ring-white/60"
        width={104}
        height={104}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="lp-heading grid size-[104px] place-items-center rounded-full text-3xl font-bold shadow-md ring-4 ring-white/60"
      style={{ background: "var(--lp-accent)", color: "var(--lp-accent-text)" }}
    >
      {initials || "?"}
    </div>
  );
}

function LinksList({ links, onItemClick, onToast }: { links: LinkItem[]; onItemClick: ItemClick; onToast: (m: string) => void }) {
  return (
    <div className="lp-enter flex flex-col gap-3.5">
      {links.map((l) => {
        if (l.kind === "header") {
          return (
            <h2 key={l.id} className="mt-3 text-center text-[17px] font-bold">
              {l.title}
            </h2>
          );
        }
        if (l.kind === "featured") {
          return (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onItemClick(l.id)}
              className={`lp-card lp-link block overflow-hidden ${l.highlight ? "lp-highlight" : ""}`}
            >
              <div className="aspect-[16/9] w-full overflow-hidden">
                <ImageOrPlaceholder src={l.imageUrl} label={l.title} />
              </div>
              <div className="relative px-5 py-3.5 text-center">
                <div className="text-[16px] font-semibold">{l.title}</div>
                {l.subtitle && <div className="mt-0.5 text-[14px] opacity-75">{l.subtitle}</div>}
              </div>
            </a>
          );
        }
        return (
          <div key={l.id} className={`relative ${l.highlight ? "lp-highlight" : ""}`}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onItemClick(l.id)}
              className="lp-card lp-link flex min-h-[64px] items-center gap-3 px-2.5 py-2.5"
            >
              <span className="size-11 shrink-0 overflow-hidden" style={{ borderRadius: "calc(var(--lp-radius) * 0.6)" }}>
                {l.imageUrl && <img src={l.imageUrl} alt="" className="size-full object-cover" />}
              </span>
              <span className="min-w-0 flex-1 text-center">
                <span className="block text-[16px] font-semibold leading-snug">{l.title}</span>
                {l.subtitle && <span className="block text-[13px] leading-snug opacity-70">{l.subtitle}</span>}
              </span>
              <span className="size-11 shrink-0" />
            </a>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <ItemMenu title={l.title} url={l.url} onToast={onToast} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShopView({
  site,
  products,
  collections,
  query,
  setQuery,
  onOpenCollection,
  onItemClick,
  onToast,
}: {
  site: Site;
  products: Product[];
  collections: Collection[];
  query: string;
  setQuery: (q: string) => void;
  onOpenCollection: (id: string) => void;
  onItemClick: ItemClick;
  onToast: (m: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const results = q
    ? products.filter((p) => `${p.title} ${p.description} ${p.badge}`.toLowerCase().includes(q))
    : products.filter((p) => p.showInGrid);

  const collectionCards = !q && collections.length > 0 && (
    <div className="flex flex-col gap-4">
      {collections.map((c) => (
        <CollectionCard
          key={c.id}
          collection={c}
          products={products.filter((p) => p.collectionIds.includes(c.id))}
          onOpen={() => onOpenCollection(c.id)}
        />
      ))}
    </div>
  );

  return (
    <div className="lp-enter flex flex-col gap-4">
      {site.shop.showSearch && (
        <label className="lp-card flex items-center gap-3 px-4 py-3" style={{ borderRadius: 999 }}>
          <Search className="size-5 shrink-0 opacity-60" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={site.shop.searchPlaceholder}
            className="w-full min-w-0 bg-transparent text-[16px] outline-none placeholder:text-current placeholder:opacity-50"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="opacity-60">
              <X className="size-5" />
            </button>
          )}
        </label>
      )}
      {site.shop.collectionsPosition === "top" && collectionCards}
      {results.length > 0 ? (
        <ProductGrid products={results} onItemClick={onItemClick} onToast={onToast} />
      ) : q ? (
        <p className="py-10 text-center opacity-70">No products match “{query}”.</p>
      ) : null}
      {site.shop.collectionsPosition === "bottom" && collectionCards}
    </div>
  );
}

function ProductGrid({ products, onItemClick, onToast }: { products: Product[]; onItemClick: ItemClick; onToast: (m: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      {products.map((p) => (
        <div key={p.id} className="lp-card relative flex flex-col overflow-hidden">
          <a href={p.url} target="_blank" rel="noopener noreferrer sponsored" onClick={onItemClick(p.id)} className="block">
            <div className="relative aspect-square w-full overflow-hidden">
              <ImageOrPlaceholder src={p.imageUrl} label={p.title} />
              {p.badge && (
                <span
                  className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow"
                  style={{ background: "var(--lp-accent)", color: "var(--lp-accent-text)" }}
                >
                  {p.badge}
                </span>
              )}
            </div>
            <div className="py-2.5 pl-3 pr-8">
              <div className="truncate text-[15px] font-semibold leading-snug">{p.title}</div>
              {p.price && <div className="mt-0.5 text-[13px] opacity-70">{p.price}</div>}
            </div>
          </a>
          <div className="absolute bottom-2 right-1">
            <ItemMenu title={p.title} url={p.url} onToast={onToast} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CollectionCard({ collection, products, onOpen }: { collection: Collection; products: Product[]; onOpen: () => void }) {
  const imgs = products.slice(0, 5);
  while (imgs.length < 5 && products.length > 0) imgs.push(products[imgs.length % products.length]);
  return (
    <button type="button" onClick={onOpen} className="lp-card block w-full overflow-hidden p-2.5 text-left">
      <div className="grid aspect-[2/1] grid-cols-4 grid-rows-2 gap-1 overflow-hidden" style={{ borderRadius: "calc(var(--lp-radius) * 0.7)" }}>
        {imgs.map((p, i) => (
          <div key={i} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <ImageOrPlaceholder src={p.imageUrl} label={p.title} />
          </div>
        ))}
      </div>
      <div className="px-2 pb-1 pt-3 text-center">
        <div className="text-[17px] font-semibold">{collection.title}</div>
        <div className="text-[14px] opacity-70">
          {products.length} product{products.length === 1 ? "" : "s"}
        </div>
      </div>
    </button>
  );
}

function CollectionView({
  collection,
  products,
  onBack,
  onItemClick,
  onToast,
}: {
  collection: Collection;
  products: Product[];
  onBack: () => void;
  onItemClick: ItemClick;
  onToast: (m: string) => void;
}) {
  return (
    <div className="lp-enter flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to shop"
          className="lp-card grid size-10 shrink-0 place-items-center"
          style={{ borderRadius: 999 }}
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-[20px] font-bold">{collection.title}</h2>
          {collection.description && <p className="text-[14px]" style={{ color: "var(--lp-muted)" }}>{collection.description}</p>}
        </div>
      </div>
      <ProductGrid products={products} onItemClick={onItemClick} onToast={onToast} />
    </div>
  );
}

function ItemMenu({ title, url, onToast }: { title: string; url: string; onToast: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`More options for ${title}`}
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-full opacity-60 transition hover:bg-black/5 hover:opacity-100"
      >
        <MoreVertical className="size-[18px]" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-20 mb-1 w-40 overflow-hidden rounded-xl bg-white py-1 text-[14px] text-neutral-800 shadow-xl ring-1 ring-black/5">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100"
            onClick={() => {
              setOpen(false);
              share(title, url, onToast);
            }}
          >
            <Share2 className="size-4" /> Share
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100"
            onClick={() => {
              setOpen(false);
              copy(url, onToast);
            }}
          >
            <Copy className="size-4" /> Copy link
          </button>
        </div>
      )}
    </div>
  );
}

function ImageOrPlaceholder({ src, label }: { src: string; label: string }) {
  if (src) return <img src={src} alt={label} loading="lazy" className="size-full object-cover" />;
  const hue = [...label].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <div
      className="lp-heading grid size-full place-items-center text-4xl font-bold text-white/90"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 72%), hsl(${(hue + 40) % 360} 70% 62%))` }}
    >
      {label.trim()[0]?.toUpperCase() ?? ""}
    </div>
  );
}

function beacon(data: Record<string, string>) {
  const body = JSON.stringify(data);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
  } catch {}
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

async function share(title: string, url: string, onToast: (m: string) => void) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  copy(url, onToast);
}

async function copy(url: string, onToast: (m: string) => void) {
  try {
    await navigator.clipboard.writeText(url);
    onToast("Link copied");
  } catch {
    onToast("Couldn't copy link");
  }
}
