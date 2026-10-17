"use client";
/* eslint-disable @next/next/no-img-element -- admin thumbnails */

import { ChevronDown, Heading, ImageIcon, Link2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import type { LinkItem, Site } from "@/lib/types";
import type { SectionProps } from "./sections-profile";
import { Button, Card, DeleteButton, EmptyState, Field, ImageInput, SortableList, TextInput, Toggle, ToggleRow, uid } from "./ui";

const KIND = {
  link: { label: "Link", icon: Link2 },
  featured: { label: "Featured card", icon: ImageIcon },
  header: { label: "Section header", icon: Heading },
} as const;

export function LinksSection({ site, update }: SectionProps) {
  const [open, setOpen] = useState<string | null>(null);
  const setLinks = (links: Site["links"]) => update((s) => ({ ...s, links }));

  const add = (kind: LinkItem["kind"]) => {
    const item: LinkItem = {
      id: uid("l"),
      kind,
      title: kind === "header" ? "New section" : "",
      subtitle: "",
      url: "",
      imageUrl: "",
      enabled: true,
      highlight: false,
    };
    setLinks([item, ...site.links]);
    setOpen(item.id);
  };

  return (
    <Card
      title="Links"
      description="Shown on the Links tab. Drag to reorder, click a row to edit."
      actions={
        <>
          <Button onClick={() => add("header")} title="Add section header">
            <Heading className="size-4" />
            <span className="hidden sm:inline">Header</span>
          </Button>
          <Button onClick={() => add("featured")} title="Add featured card">
            <ImageIcon className="size-4" />
            <span className="hidden sm:inline">Featured</span>
          </Button>
          <Button variant="primary" onClick={() => add("link")}>
            <Plus className="size-4" /> Link
          </Button>
        </>
      }
    >
      {site.links.length === 0 ? (
        <EmptyState>No links yet. Click “Link” to add your first one.</EmptyState>
      ) : (
        <SortableList
          items={site.links}
          onChange={setLinks}
          render={(item, handle) => {
            const patch = (p: Partial<LinkItem>) => setLinks(site.links.map((l) => (l.id === item.id ? { ...l, ...p } : l)));
            const Icon = KIND[item.kind].icon;
            const isOpen = open === item.id;
            return (
              <div className={`rounded-xl bg-zinc-50 ring-1 ring-zinc-200/70 ${item.enabled ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-2 p-2">
                  {handle}
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-zinc-500 ring-1 ring-zinc-200">
                      <Icon className="size-4" />
                    </span>
                  )}
                  <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-1.5 truncate text-[14px] font-medium text-zinc-900">
                      {item.title || <span className="text-zinc-400">Untitled</span>}
                      {item.highlight && <Sparkles className="size-3.5 shrink-0 text-amber-500" />}
                    </div>
                    <div className="truncate text-[12px] text-zinc-500">
                      {item.kind === "header" ? "Section header" : item.url || "No URL yet"}
                    </div>
                  </button>
                  <Toggle checked={item.enabled} onChange={(enabled) => patch({ enabled })} label="Visible" />
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.id)}
                    className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-200/60"
                    aria-label={isOpen ? "Collapse" : "Edit"}
                  >
                    <ChevronDown className={`size-4 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {isOpen && (
                  <div className="space-y-4 border-t border-zinc-200/70 p-4">
                    <Field label={item.kind === "header" ? "Header text" : "Title"}>
                      <TextInput value={item.title} onChange={(title) => patch({ title })} maxLength={200} autoFocus />
                    </Field>
                    {item.kind !== "header" && (
                      <>
                        <Field label="URL">
                          <TextInput value={item.url} onChange={(url) => patch({ url })} placeholder="https://" inputMode="url" />
                        </Field>
                        <Field label="Subtitle" hint="Optional small text under the title.">
                          <TextInput value={item.subtitle} onChange={(subtitle) => patch({ subtitle })} maxLength={300} />
                        </Field>
                        <Field label={item.kind === "featured" ? "Image (16:9 looks best)" : "Thumbnail (optional)"}>
                          <ImageInput
                            value={item.imageUrl}
                            onChange={(imageUrl) => patch({ imageUrl })}
                            shape={item.kind === "featured" ? "wide" : "square"}
                          />
                        </Field>
                        <ToggleRow
                          label="Highlight"
                          hint="Gently wiggles to draw attention."
                          checked={item.highlight}
                          onChange={(highlight) => patch({ highlight })}
                        />
                        <Field label="Style">
                          <div className="flex gap-2">
                            {(["link", "featured"] as const).map((k) => (
                              <Button key={k} variant={item.kind === k ? "primary" : "secondary"} onClick={() => patch({ kind: k })}>
                                {KIND[k].label}
                              </Button>
                            ))}
                          </div>
                        </Field>
                      </>
                    )}
                    <div className="flex justify-end">
                      <DeleteButton onConfirm={() => setLinks(site.links.filter((l) => l.id !== item.id))} />
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
