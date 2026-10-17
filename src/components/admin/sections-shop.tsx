"use client";
/* eslint-disable @next/next/no-img-element -- admin thumbnails */

import { AlertTriangle, ChevronDown, Loader2, Package, Plus, Search, Wand2 } from "lucide-react";
import { useState } from "react";
import { fetchPreview } from "@/app/admin/actions";
import type { Collection, Product, Site } from "@/lib/types";
import type { SectionProps } from "./sections-profile";
import { Button, Card, DeleteButton, EmptyState, Field, ImageInput, Select, SortableList, TextArea, TextInput, Toggle, ToggleRow, uid } from "./ui";

export function ShopSection({ site, update }: SectionProps) {
  return (
    <div className="space-y-5">
      <ProductsCard site={site} update={update} />
      <CollectionsCard site={site} update={update} />
      <ShopSettingsCard site={site} update={update} />
    </div>
  );
}

function amazonWarning(url: string) {
  try {
    const u = new URL(url);
    if (!/(^|\.)amazon\./.test(u.hostname)) return null;
    return u.searchParams.get("tag") ? null : "This Amazon link has no affiliate tag (?tag=…), so you won't earn from it.";
  } catch {
    return null;
  }
}

function ProductsCard({ site, update }: SectionProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const setProducts = (products: Site["products"]) => update((s) => ({ ...s, products }));

  const add = () => {
    const p: Product = {
      id: uid("p"),
      title: "",
      url: "",
      imageUrl: "",
      price: "",
      badge: "",
      description: "",
      enabled: true,
      showInGrid: true,
      collectionIds: [],
    };
    setProducts([p, ...site.products]);
    setOpen(p.id);
    setFilter("");
  };

  const f = filter.trim().toLowerCase();
  const visible = f ? site.products.filter((p) => p.title.toLowerCase().includes(f)) : site.products;

  return (
    <Card
      title="Products"
      description="Shown on the Shop tab. Paste a product link and click “Fetch details” to fill it in."
      actions={
        <Button variant="primary" onClick={add}>
          <Plus className="size-4" /> Product
        </Button>
      }
    >
      {site.products.length > 6 && (
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2">
          <Search className="size-4 text-zinc-400" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a product" className="w-full bg-transparent text-[14px] outline-none" />
        </label>
      )}
      {site.products.length === 0 ? (
        <EmptyState>No products yet. Click “Product” to add one.</EmptyState>
      ) : (
        <SortableList
          items={visible}
          onChange={(items) => {
            if (!f) return setProducts(items);
            // Reordering a filtered list: keep hidden products where they were.
            const ids = new Set(items.map((i) => i.id));
            let k = 0;
            setProducts(site.products.map((p) => (ids.has(p.id) ? items[k++] : p)));
          }}
          render={(item, handle) => (
            <ProductRow
              key={item.id}
              item={item}
              handle={handle}
              collections={site.collections}
              open={open === item.id}
              onToggleOpen={() => setOpen(open === item.id ? null : item.id)}
              onChange={(patch) => setProducts(site.products.map((p) => (p.id === item.id ? { ...p, ...patch } : p)))}
              onDelete={() => setProducts(site.products.filter((p) => p.id !== item.id))}
            />
          )}
        />
      )}
    </Card>
  );
}

function ProductRow({
  item,
  handle,
  collections,
  open,
  onToggleOpen,
  onChange,
  onDelete,
}: {
  item: Product;
  handle: React.ReactNode;
  collections: Collection[];
  open: boolean;
  onToggleOpen: () => void;
  onChange: (p: Partial<Product>) => void;
  onDelete: () => void;
}) {
  const [fetching, setFetching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const warning = amazonWarning(item.url);

  async function autofill() {
    setFetching(true);
    setMsg(null);
    const res = await fetchPreview(item.url);
    setFetching(false);
    if ("error" in res) return setMsg(res.error);
    onChange({
      title: item.title || res.title || "",
      imageUrl: item.imageUrl || res.image || "",
      price: item.price || res.price || "",
    });
    setMsg("Filled in what we found. Check the details.");
  }

  return (
    <div className={`rounded-xl bg-zinc-50 ring-1 ring-zinc-200/70 ${item.enabled ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-2 p-2">
        {handle}
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-zinc-400 ring-1 ring-zinc-200">
            <Package className="size-4" />
          </span>
        )}
        <button type="button" onClick={onToggleOpen} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5 truncate text-[14px] font-medium text-zinc-900">
            {item.title || <span className="text-zinc-400">Untitled product</span>}
            {warning && <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />}
          </div>
          <div className="truncate text-[12px] text-zinc-500">
            {[item.price, item.collectionIds.length ? `${item.collectionIds.length} collection${item.collectionIds.length > 1 ? "s" : ""}` : "", !item.showInGrid ? "hidden from grid" : ""]
              .filter(Boolean)
              .join(" · ") || item.url || "No link yet"}
          </div>
        </button>
        <Toggle checked={item.enabled} onChange={(enabled) => onChange({ enabled })} label="Visible" />
        <button type="button" onClick={onToggleOpen} className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-200/60" aria-label={open ? "Collapse" : "Edit"}>
          <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="space-y-4 border-t border-zinc-200/70 p-4">
          <Field
            label="Product link"
            hint={warning ? <span className="text-amber-600">{warning}</span> : "Your affiliate link (Amazon, LTK, shop page…)."}
          >
            <div className="flex gap-2">
              <TextInput value={item.url} onChange={(url) => onChange({ url })} placeholder="https://" inputMode="url" autoFocus />
              <Button onClick={autofill} disabled={!item.url || fetching} title="Fetch title, image and price from the link">
                {fetching ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                <span className="hidden sm:inline">Fetch details</span>
              </Button>
            </div>
          </Field>
          {msg && <p className="-mt-2 text-[12px] text-zinc-600">{msg}</p>}
          <Field label="Title">
            <TextInput value={item.title} onChange={(title) => onChange({ title })} maxLength={200} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price">
              <TextInput value={item.price} onChange={(price) => onChange({ price })} placeholder="$19.99" maxLength={40} />
            </Field>
            <Field label="Badge">
              <TextInput value={item.badge} onChange={(badge) => onChange({ badge })} placeholder="New, Fave, Sale…" maxLength={40} />
            </Field>
          </div>
          <Field label="Image">
            <ImageInput value={item.imageUrl} onChange={(imageUrl) => onChange({ imageUrl })} maxSize={800} />
          </Field>
          <Field label="Notes" hint="Optional. Not shown on the card, but included in search.">
            <TextArea value={item.description} onChange={(description) => onChange({ description })} rows={2} maxLength={500} />
          </Field>
          {collections.length > 0 && (
            <Field label="Collections">
              <div className="flex flex-wrap gap-2">
                {collections.map((c) => {
                  const on = item.collectionIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        onChange({ collectionIds: on ? item.collectionIds.filter((x) => x !== c.id) : [...item.collectionIds, c.id] })
                      }
                      className={`rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition ${on ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-700 ring-zinc-200 hover:ring-zinc-400"}`}
                    >
                      {c.title || "Untitled"}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
          <ToggleRow
            label="Show in main grid"
            hint="Turn off to show this product only inside its collections."
            checked={item.showInGrid}
            onChange={(showInGrid) => onChange({ showInGrid })}
          />
          <div className="flex justify-end">
            <DeleteButton onConfirm={onDelete} />
          </div>
        </div>
      )}
    </div>
  );
}

function CollectionsCard({ site, update }: SectionProps) {
  const [open, setOpen] = useState<string | null>(null);
  const setCollections = (collections: Site["collections"]) => update((s) => ({ ...s, collections }));
  const count = (id: string) => site.products.filter((p) => p.collectionIds.includes(id)).length;

  return (
    <Card
      title="Collections"
      description="Group products, e.g. “Art supplies”. Each shows as a photo collage card. Add products to a collection from the product's settings."
      actions={
        <Button
          variant="primary"
          onClick={() => {
            const c: Collection = { id: uid("c"), title: "New collection", description: "", enabled: true };
            setCollections([...site.collections, c]);
            setOpen(c.id);
          }}
        >
          <Plus className="size-4" /> Collection
        </Button>
      }
    >
      {site.collections.length === 0 ? (
        <EmptyState>No collections yet.</EmptyState>
      ) : (
        <SortableList
          items={site.collections}
          onChange={setCollections}
          render={(item, handle) => {
            const patch = (p: Partial<Collection>) => setCollections(site.collections.map((c) => (c.id === item.id ? { ...c, ...p } : c)));
            const isOpen = open === item.id;
            const n = count(item.id);
            return (
              <div className={`rounded-xl bg-zinc-50 ring-1 ring-zinc-200/70 ${item.enabled ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-2 p-2">
                  {handle}
                  <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-[14px] font-medium text-zinc-900">{item.title || "Untitled"}</div>
                    <div className="text-[12px] text-zinc-500">
                      {n} product{n === 1 ? "" : "s"}
                      {n === 0 && " · hidden until it has products"}
                    </div>
                  </button>
                  <Toggle checked={item.enabled} onChange={(enabled) => patch({ enabled })} label="Visible" />
                  <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-200/60" aria-label="Edit">
                    <ChevronDown className={`size-4 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {isOpen && (
                  <div className="space-y-4 border-t border-zinc-200/70 p-4">
                    <Field label="Name">
                      <TextInput value={item.title} onChange={(title) => patch({ title })} maxLength={120} autoFocus />
                    </Field>
                    <Field label="Description" hint="Shown when someone opens the collection.">
                      <TextInput value={item.description} onChange={(description) => patch({ description })} maxLength={300} />
                    </Field>
                    <div className="flex justify-end">
                      <DeleteButton
                        onConfirm={() =>
                          update((s) => ({
                            ...s,
                            collections: s.collections.filter((c) => c.id !== item.id),
                            products: s.products.map((p) => ({ ...p, collectionIds: p.collectionIds.filter((x) => x !== item.id) })),
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          }}
        />
      )}
    </Card>
  );
}

function ShopSettingsCard({ site, update }: SectionProps) {
  const shop = site.shop;
  const set = (patch: Partial<Site["shop"]>) => update((s) => ({ ...s, shop: { ...s.shop, ...patch } }));
  return (
    <Card title="Shop settings">
      <div className="space-y-4">
        <ToggleRow label="Show the Shop tab" hint="Appears when at least one product is visible." checked={shop.enabled} onChange={(enabled) => set({ enabled })} />
        <ToggleRow label="Product search bar" checked={shop.showSearch} onChange={(showSearch) => set({ showSearch })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Links tab label">
            <TextInput value={shop.linksLabel} onChange={(linksLabel) => set({ linksLabel })} maxLength={30} />
          </Field>
          <Field label="Shop tab label">
            <TextInput value={shop.shopLabel} onChange={(shopLabel) => set({ shopLabel })} maxLength={30} />
          </Field>
          <Field label="Open on">
            <Select value={shop.defaultTab} onChange={(defaultTab) => set({ defaultTab })} options={[{ value: "links", label: "Links tab" }, { value: "shop", label: "Shop tab" }]} />
          </Field>
          <Field label="Collections go">
            <Select
              value={shop.collectionsPosition}
              onChange={(collectionsPosition) => set({ collectionsPosition })}
              options={[{ value: "top", label: "Above products" }, { value: "bottom", label: "Below products" }]}
            />
          </Field>
        </div>
        <Field label="Search placeholder">
          <TextInput value={shop.searchPlaceholder} onChange={(searchPlaceholder) => set({ searchPlaceholder })} maxLength={80} />
        </Field>
        <Field label="Affiliate disclosure" hint="Amazon Associates requires a disclosure like this. Shown at the bottom of the Shop tab.">
          <TextArea value={shop.disclosure} onChange={(disclosure) => set({ disclosure })} rows={2} maxLength={400} />
        </Field>
      </div>
    </Card>
  );
}
