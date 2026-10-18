"use client";
/* eslint-disable @next/next/no-img-element -- images come from Blob or any affiliate host */

import { ArrowLeft, Check, Copy, MoreVertical, Search, Share2, ShoppingBag, Sparkles, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { EventType, ItemKind } from "@/lib/analytics-types";
import { fontVar } from "@/lib/themes";
import type { Collection, LinkItem, Product, Site } from "@/lib/types";
import { SOCIALS } from "./social-icons";

type Tab = "links" | "shop";

type TrackEvent = { t: EventType; id?: string; k?: ItemKind; title?: string; url?: string; tab?: Tab; q?: string };
type ClickInfo = { id: string; kind: ItemKind; title: string; url: string };

const TrackCtx = createContext<(e: TrackEvent) => void>(() => {});

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
  // Only show the Links/Shop toggle when both tabs have something in them.
  const showTabs = shopOn && links.length > 0;
  const activeTab: Tab = !shopOn ? "links" : links.length === 0 ? "shop" : tab;

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

  const track = useCallback(
    (e: TrackEvent) => {
      if (preview) return;
      beacon({ ...e, ...visitContext() });
    },
    [preview],
  );

  // Page view, once per browser session.
  useEffect(() => {
    if (preview) return;
    try {
      if (sessionStorage.getItem("lp-viewed")) return;
      sessionStorage.setItem("lp-viewed", "1");
    } catch {}
    track({ t: "view" });
  }, [preview, track]);

  // What people search for in the shop (after they stop typing).
  const lastSearch = useRef("");
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (preview || q.length < 2 || q === lastSearch.current) return;
    const timer = setTimeout(() => {
      lastSearch.current = q;
      track({ t: "search", q });
    }, 1200);
    return () => clearTimeout(timer);
  }, [query, preview, track]);

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

  const onItemClick = (item: ClickInfo) => (e: MouseEvent) => {
    if (preview) {
      e.preventDefault();
      return;
    }
    track({ t: "click", id: item.id, k: item.kind, title: item.title, url: item.url, tab: activeTab });
  };

  const sharePage = () => {
    track({ t: "share", id: "page", k: "page", title: profile.name });
    share(profile.name, window.location.href.split("#")[0], showToast);
  };

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
    "--lp-heading-color": theme.headingColor || theme.text,
  } as CSSProperties;

  const background: CSSProperties =
    theme.bgType === "image" && theme.bgImageUrl
      ? { backgroundImage: `url("${theme.bgImageUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
      : theme.bgType === "solid"
        ? { background: theme.bgFrom }
        : { background: `linear-gradient(180deg, ${theme.bgFrom} 0%, ${theme.bgTo} 70%)` };

  const collection = openCollection ? collections.find((c) => c.id === openCollection) : undefined;

  return (
    <TrackCtx.Provider value={track}>
    <div
      className={`lp-root relative isolate ${preview ? "lp-preview min-h-full" : "min-h-dvh"} lp-btn-${theme.buttonStyle} ${theme.shadow ? "lp-shadow" : ""}`}
      style={style}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden" style={background} aria-hidden>
        {theme.bgType === "image" && theme.bgImageUrl && <div className="absolute inset-0 bg-black/25" />}
        {theme.pattern !== "none" && <Pattern kind={theme.pattern} color={theme.cardBg} />}
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

        {theme.headerAlign === "left" ? (
          <header className="lp-enter flex flex-col pt-1">
            <div className="flex items-center gap-4">
              <Avatar url={profile.avatarUrl} name={profile.name} size={96} />
              <div className="min-w-0">
                <h1 className="text-[26px] font-extrabold leading-tight tracking-tight" style={{ color: "var(--lp-heading-color)" }}>
                  {profile.name}
                </h1>
                {profile.tagline && <p className="mt-0.5 text-[15px] opacity-90">{profile.tagline}</p>}
                <SocialIcons socials={socials} onItemClick={onItemClick} className="mt-2.5 justify-start gap-x-4" />
              </div>
            </div>
            {profile.bio && (
              <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "var(--lp-muted)" }}>
                {profile.bio}
              </p>
            )}
          </header>
        ) : (
          <header className="lp-enter flex flex-col items-center pt-2 text-center">
            <Avatar url={profile.avatarUrl} name={profile.name} />
            <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight" style={{ color: "var(--lp-heading-color)" }}>
              {profile.name}
            </h1>
            {profile.tagline && <p className="mt-1 text-[17px] opacity-90">{profile.tagline}</p>}
            {profile.bio && (
              <p className="mt-3 max-w-[440px] whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "var(--lp-muted)" }}>
                {profile.bio}
              </p>
            )}
            <SocialIcons socials={socials} onItemClick={onItemClick} className="mt-5 justify-center gap-x-5" />
          </header>
        )}

        {showTabs && (
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
                  onClick={() => {
                    if (t !== activeTab) track({ t: "tab", id: t, k: "tab", title: t === "links" ? shop.linksLabel : shop.shopLabel });
                    navigate(t);
                  }}
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
              buyLabel={shop.buyLabel}
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
              onOpenCollection={(id) => {
                track({ t: "collection", id, k: "collection", title: collections.find((c) => c.id === id)?.title });
                navigate("shop", id);
              }}
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
    </TrackCtx.Provider>
  );
}

type ItemClick = (item: ClickInfo) => (e: MouseEvent) => void;

function Avatar({ url, name, size = 108 }: { url: string; name: string; size?: number }) {
  const [failed, imgRef, onImgError] = useImageFailed(url);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        ref={imgRef}
        onError={onImgError}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover shadow-[0_8px_30px_-6px_rgb(0_0_0/0.35)] ring-4 ring-white/70"
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
      className="lp-heading grid shrink-0 place-items-center rounded-full text-3xl font-bold shadow-[0_8px_30px_-6px_rgb(0_0_0/0.35)] ring-4 ring-white/70"
      style={{ width: size, height: size, background: "var(--lp-card)", color: "var(--lp-card-text)" }}
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
            <h2 key={l.id} className="mt-3 text-center text-[19px] font-extrabold" style={{ color: "var(--lp-heading-color)" }}>
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
              onClick={onItemClick({ id: l.id, kind: "featured", title: l.title, url: l.url })}
              className={`lp-card lp-link block overflow-hidden ${l.highlight ? "lp-highlight" : ""}`}
            >
              <div className="aspect-[16/9] w-full overflow-hidden">
                <ImageOrPlaceholder src={l.imageUrl} label={l.title} kind="link" />
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
              onClick={onItemClick({ id: l.id, kind: "link", title: l.title, url: l.url })}
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
              <ItemMenu id={l.id} kind="link" title={l.title} url={l.url} onToast={onToast} />
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
        <ProductGrid products={results} onItemClick={onItemClick} onToast={onToast} buyLabel={site.shop.buyLabel} />
      ) : q ? (
        <p className="py-10 text-center opacity-70">No products match “{query}”.</p>
      ) : null}
      {site.shop.collectionsPosition === "bottom" && collectionCards}
    </div>
  );
}

function ProductGrid({
  products,
  onItemClick,
  onToast,
  buyLabel,
}: {
  products: Product[];
  onItemClick: ItemClick;
  onToast: (m: string) => void;
  buyLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      {products.map((p) => (
        <div key={p.id} className="lp-card relative flex flex-col overflow-hidden">
          <a href={p.url} target="_blank" rel="noopener noreferrer sponsored" onClick={onItemClick({ id: p.id, kind: "product", title: p.title, url: p.url })} className="block">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
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
              <div className="line-clamp-2 text-[15px] font-bold leading-snug">{p.title}</div>
              {p.price && <div className="mt-0.5 text-[13px] opacity-80">{p.price}</div>}
            </div>
          </a>
          {buyLabel && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={onItemClick({ id: p.id, kind: "product", title: p.title, url: p.url })}
              className="mx-3 mb-3 mt-auto block rounded-full py-2 text-center text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: "var(--lp-card-text)", color: "var(--lp-card)" }}
            >
              {buyLabel}
            </a>
          )}
          <div className={`absolute right-1 ${buyLabel ? "bottom-[56px]" : "bottom-2"}`}>
            <ItemMenu id={p.id} kind="product" title={p.title} url={p.url} onToast={onToast} />
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
  buyLabel,
}: {
  buyLabel: string;
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
      <ProductGrid products={products} onItemClick={onItemClick} onToast={onToast} buyLabel={buyLabel} />
    </div>
  );
}

function ItemMenu({ id, kind, title, url, onToast }: { id: string; kind: ItemKind; title: string; url: string; onToast: (m: string) => void }) {
  const track = useContext(TrackCtx);
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
              track({ t: "share", id, k: kind, title, url });
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
              track({ t: "share", id, k: kind, title, url });
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

/**
 * Tracks whether an <img> failed. The callback ref also catches images that failed
 * before hydration, which never fire React's onError.
 */
function useImageFailed(src: string) {
  const [failed, setFailed] = useState<string | null>(null);
  const markFailed = useCallback(() => setFailed(src), [src]);
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && img.complete && img.naturalWidth === 0) setFailed(src);
    },
    [src],
  );
  return [!!src && failed === src, ref, markFailed] as const;
}

/** A bare address or domain typed into the admin still needs a scheme to open the right place. */
function socialHref(platform: string, raw: string) {
  const url = raw.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  if (platform === "email" || /^[^\s/@]+@[^\s/@]+$/.test(url)) return `mailto:${url}`;
  return `https://${url.replace(/^\/+/, "")}`;
}

function SocialIcons({ socials, onItemClick, className }: { socials: Site["socials"]; onItemClick: ItemClick; className: string }) {
  if (socials.length === 0) return null;
  return (
    <nav className={`flex flex-wrap gap-y-3 ${className}`} aria-label="Social links" style={{ color: "var(--lp-heading-color)" }}>
      {socials.map((s) => {
        const { icon: Icon, label } = SOCIALS[s.platform];
        const href = socialHref(s.platform, s.url);
        const mail = href.startsWith("mailto:");
        return (
          <a
            key={s.id}
            href={href}
            {...(mail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            aria-label={label}
            title={label}
            onClick={onItemClick({ id: s.id, kind: "social", title: label, url: href })}
            className="transition hover:-translate-y-0.5 hover:opacity-80"
          >
            <Icon className="size-[28px]" />
          </a>
        );
      })}
    </nav>
  );
}

/** Decorative background shapes, tinted from the card colour. */
function Pattern({ kind, color }: { kind: "daisies" | "dots"; color: string }) {
  const petal = `color-mix(in srgb, ${color} 55%, white)`;
  // Fixed positions so server and client render the same; repeated down the page.
  const spots = [
    { x: "84%", y: -30, s: 120, r: 10 },
    { x: "-8%", y: 240, s: 110, r: -15 },
    { x: "-8%", y: 520, s: 130, r: 30 },
    { x: "90%", y: 760, s: 120, r: 5 },
    { x: "-5%", y: 1080, s: 110, r: -20 },
    { x: "89%", y: 1300, s: 125, r: 25 },
    { x: "-7%", y: 1650, s: 120, r: 0 },
    { x: "90%", y: 1900, s: 110, r: -10 },
    { x: "-6%", y: 2250, s: 125, r: 15 },
    { x: "89%", y: 2500, s: 115, r: -25 },
    { x: "-7%", y: 2850, s: 120, r: 5 },
    { x: "90%", y: 3100, s: 120, r: 20 },
  ];
  return (
    <>
      {spots.map((p, i) => (
        <svg
          key={i}
          viewBox="-50 -50 100 100"
          className="absolute"
          style={{ left: p.x, top: p.y, width: kind === "dots" ? p.s * 0.45 : p.s, transform: `rotate(${p.r}deg)` }}
        >
          {kind === "daisies" ? (
            <>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <ellipse key={a} cx="0" cy="-24" rx="17" ry="24" fill={petal} transform={`rotate(${a})`} />
              ))}
              <circle r="14" fill="#ffe27a" />
            </>
          ) : (
            <circle r="48" fill={petal} />
          )}
        </svg>
      ))}
    </>
  );
}

function ImageOrPlaceholder({ src, label, kind = "product" }: { src: string; label: string; kind?: "product" | "link" }) {
  const [failed, imgRef, onImgError] = useImageFailed(src);
  if (src && !failed) {
    return <img ref={imgRef} src={src} alt={label} loading="lazy" onError={onImgError} className="size-full object-cover" />;
  }
  const hue = [...label].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const Icon = kind === "link" ? Sparkles : ShoppingBag;
  return (
    <div
      className="relative grid size-full place-items-center overflow-hidden"
      style={{ background: `linear-gradient(140deg, hsl(${hue} 75% 90%), hsl(${(hue + 50) % 360} 70% 80%))` }}
      aria-hidden
    >
      <span className="absolute -right-6 -top-6 size-24 rounded-full bg-white/35 blur-xl" />
      <span className="absolute -bottom-8 -left-4 size-28 rounded-full blur-2xl" style={{ background: `hsl(${(hue + 25) % 360} 80% 75% / 0.6)` }} />
      <span
        className="relative grid size-14 place-items-center rounded-2xl bg-white/60 shadow-sm ring-1 ring-white/70 backdrop-blur"
        style={{ color: `hsl(${hue} 45% 38%)` }}
      >
        <Icon className="size-6" strokeWidth={1.8} />
      </span>
    </div>
  );
}

function beacon(data: object) {
  const body = JSON.stringify(data);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
  } catch {}
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}

/** Where the visit came from: utm tags in the link, and the page that linked here. */
function visitContext() {
  const ctx: { us?: string; um?: string; uc?: string; ref?: string } = {};
  try {
    const p = new URLSearchParams(window.location.search);
    const us = p.get("utm_source");
    const um = p.get("utm_medium");
    const uc = p.get("utm_campaign");
    if (us) ctx.us = us.slice(0, 60);
    if (um) ctx.um = um.slice(0, 60);
    if (uc) ctx.uc = uc.slice(0, 80);
    if (document.referrer) ctx.ref = new URL(document.referrer).origin;
  } catch {}
  return ctx;
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
