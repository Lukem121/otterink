"use client";

import { AlertTriangle, ChevronDown, FolderHeart, Loader2, Package, Plus, Rows3, Search, Wand2 } from "lucide-react";
import { useState } from "react";
import { fetchPreview } from "@/app/admin/actions";
import type { Category, Collection, Product, Site } from "@/lib/types";
import { CATEGORY_ICON_KEYS, CATEGORY_ICONS, CategoryIcon, categoryIcon } from "@/components/site/category-icons";
import type { SectionProps } from "./sections-profile";
import { Button, Card, DeleteButton, EmptyState, Field, ImageInput, Select, SortableList, TextArea, TextInput, Thumb, Toggle, ToggleRow, rowCls, uid } from "./ui";

export function ShopSection({ site, update }: SectionProps) {
  return (
    <div className="space-y-5">
      <ProductsCard site={site} update={update} />
      <CategoriesCard site={site} update={update} />
      <CollectionsCard site={site} update={update} />
      <ShopSettingsCard site={site} update={update} />
    </div>
  );
}

/** Short store name shown on a product row. */
function store(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (/(^|\.)amazon\.|^amzn\.|^link\.amazon$|^a\.co$/.test(host)) return "Amazon";
    if (/liketoknow|shopltk|ltk\./.test(host)) return "LTK";
    if (/etsy\./.test(host)) return "Etsy";
    return host.split(".").slice(-2, -1)[0]?.replace(/^./, (c) => c.toUpperCase()) ?? "";
  } catch {
    return "";
  }
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
      categoryId: "",
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
      description="Drag to reorder. Click a product to edit it."
      actions={
        <Button variant="primary" onClick={add}>
          <Plus className="size-4" /> Product
        </Button>
      }
    >
      {site.products.length > 6 && (
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 focus-within:border-emerald-500 focus-within:bg-white">
          <Search className="size-4 text-zinc-400" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a product" className="w-full bg-transparent text-[14px] outline-none" />
        </label>
      )}
      {site.products.length === 0 ? (
        <EmptyState icon={<Package className="size-5" />}>No products yet. Click “Product” to add one.</EmptyState>
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
              categories={site.categories}
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
  categories,
  open,
  onToggleOpen,
  onChange,
  onDelete,
}: {
  item: Product;
  handle: React.ReactNode;
  collections: Collection[];
  categories: Category[];
  open: boolean;
  onToggleOpen: () => void;
  onChange: (p: Partial<Product>) => void;
  onDelete: () => void;
}) {
  const [fetching, setFetching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const warning = amazonWarning(item.url);
  const category = categories.find((c) => c.id === item.categoryId);

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
    const missing = [!res.title && !item.title && "title", !res.image && !item.imageUrl && "image"].filter(Boolean);
    setMsg(
      missing.length
        ? `Found what we could, but no ${missing.join(" or ")}. Add ${missing.length > 1 ? "them" : "it"} by hand.`
        : "Filled in what we found. Check the details.",
    );
  }

  return (
    <div className={`${rowCls} ${item.enabled ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-2 p-2">
        {handle}
        <Thumb src={item.imageUrl} fallback={<Package className="size-4" />} />
        <button type="button" onClick={onToggleOpen} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5 truncate text-[14px] font-medium text-zinc-900">
            {item.title || <span className="text-zinc-400">Untitled product</span>}
            {warning && <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />}
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-zinc-500">
            {category && <span className="shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">{category.title || "Untitled"}</span>}
            {store(item.url) && <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">{store(item.url)}</span>}
            {item.badge && <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">{item.badge}</span>}
            <span className="truncate">
              {[item.price, item.collectionIds.length ? `${item.collectionIds.length} collection${item.collectionIds.length > 1 ? "s" : ""}` : "", !item.showInGrid ? "hidden from grid" : ""]
                .filter(Boolean)
                .join(" · ") || (item.url ? "" : "No link yet")}
            </span>
          </div>
        </button>
        <Toggle checked={item.enabled} onChange={(enabled) => onChange({ enabled })} label="Visible" />
        <button type="button" onClick={onToggleOpen} className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-200/60" aria-label={open ? "Collapse" : "Edit"}>
          <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="space-y-4 border-t border-black/[0.06] p-4 sm:p-5">
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
              <TextInput value={item.price} onChange={(price) => onChange({ price })} placeholder={store(item.url) === "Amazon" ? "Leave blank for Amazon" : "$19.99"} maxLength={40} />
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
          {categories.length > 0 && (
            <Field label="Category">
              <Select
                value={category ? item.categoryId : ""}
                onChange={(categoryId) => onChange({ categoryId })}
                options={[{ value: "", label: "No category" }, ...categories.map((c) => ({ value: c.id, label: c.title || "Untitled" }))]}
              />
            </Field>
          )}
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

function CategoriesCard({ site, update }: SectionProps) {
  const [open, setOpen] = useState<string | null>(null);
  const setCategories = (categories: Site["categories"]) => update((s) => ({ ...s, categories }));
  const count = (id: string) => site.products.filter((p) => p.categoryId === id).length;

  return (
    <Card
      title="Categories"
      description="Buttons along the top of the Shop tab, like Books or Pens. Tapping one shows just those products. Drag to set the order, then pick a category in each product."
      actions={
        <Button
          variant="primary"
          onClick={() => {
            const c: Category = { id: uid("k"), title: "", enabled: true, icon: "" };
            setCategories([...site.categories, c]);
            setOpen(c.id);
          }}
        >
          <Plus className="size-4" /> Category
        </Button>
      }
    >
      {site.categories.length === 0 ? (
        <EmptyState icon={<Rows3 className="size-5" />}>No categories yet. Add one to split your shop into sections.</EmptyState>
      ) : (
        <div className="space-y-4">
          <SortableList
            items={site.categories}
            onChange={setCategories}
            render={(item, handle) => {
              const patch = (p: Partial<Category>) => setCategories(site.categories.map((c) => (c.id === item.id ? { ...c, ...p } : c)));
              const isOpen = open === item.id;
              const n = count(item.id);
              return (
                <div className={`${rowCls} ${item.enabled ? "" : "opacity-60"}`}>
                  <div className="flex items-center gap-2 p-2">
                    {handle}
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-700">
                      <CategoryIcon name={categoryIcon(item.icon, item.title)} />
                    </span>
                    <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[14px] font-medium text-zinc-900">{item.title || <span className="text-zinc-400">Untitled category</span>}</div>
                      <div className="text-[12px] text-zinc-500">
                        {n} product{n === 1 ? "" : "s"}
                        {n === 0 && " · hidden until it has products"}
                        {!item.enabled && n > 0 && " · its products are hidden too"}
                      </div>
                    </button>
                    <Toggle checked={item.enabled} onChange={(enabled) => patch({ enabled })} label="Visible" />
                    <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-200/60" aria-label="Edit">
                      <ChevronDown className={`size-4 transition ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="space-y-4 border-t border-black/[0.06] p-4 sm:p-5">
                      <Field label="Name">
                        <TextInput value={item.title} onChange={(title) => patch({ title })} placeholder="Books" maxLength={80} autoFocus />
                      </Field>
                      <Field label="Icon" hint="Auto picks one from the name.">
                        <div className="flex flex-wrap gap-1.5">
                          <IconChoice on={!item.icon} onClick={() => patch({ icon: "" })} label="Auto">
                            <span className="text-[12px] font-semibold">Auto</span>
                          </IconChoice>
                          {CATEGORY_ICON_KEYS.map((k) => (
                            <IconChoice key={k} on={item.icon === k} onClick={() => patch({ icon: k })} label={CATEGORY_ICONS[k].label}>
                              <CategoryIcon name={k} />
                            </IconChoice>
                          ))}
                        </div>
                      </Field>
                      <div className="flex justify-end">
                        <DeleteButton
                          onConfirm={() =>
                            update((s) => ({
                              ...s,
                              categories: s.categories.filter((c) => c.id !== item.id),
                              products: s.products.map((p) => (p.categoryId === item.id ? { ...p, categoryId: "" } : p)),
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
          <p className="text-[12px] text-zinc-500">“All” shows every product, including ones without a category. Hiding a category hides its products too.</p>
        </div>
      )}
    </Card>
  );
}

function IconChoice({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={on}
      className={`grid h-10 min-w-10 place-items-center rounded-lg px-2 ring-1 transition ${on ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-700 ring-zinc-200 hover:ring-zinc-400"}`}
    >
      {children}
    </button>
  );
}

function CollectionsCard({ site, update }: SectionProps) {
  const [open, setOpen] = useState<string | null>(null);
  const setCollections = (collections: Site["collections"]) => update((s) => ({ ...s, collections }));
  const count = (id: string) => site.products.filter((p) => p.collectionIds.includes(id)).length;

  return (
    <Card
      title="Collections"
      description="Each shows as a photo collage card. Add products to one from the product's settings."
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
        <EmptyState icon={<FolderHeart className="size-5" />}>No collections yet. Group products like “Markers I use”.</EmptyState>
      ) : (
        <SortableList
          items={site.collections}
          onChange={setCollections}
          render={(item, handle) => {
            const patch = (p: Partial<Collection>) => setCollections(site.collections.map((c) => (c.id === item.id ? { ...c, ...p } : c)));
            const isOpen = open === item.id;
            const n = count(item.id);
            return (
              <div className={`${rowCls} ${item.enabled ? "" : "opacity-60"}`}>
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
                  <div className="space-y-4 border-t border-black/[0.06] p-4 sm:p-5">
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
        <Field label="Product button text" hint="Adds a button under each product, e.g. “Buy now”. Leave empty for no button.">
          <TextInput value={shop.buyLabel} onChange={(buyLabel) => set({ buyLabel })} placeholder="Buy now" maxLength={30} />
        </Field>
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
