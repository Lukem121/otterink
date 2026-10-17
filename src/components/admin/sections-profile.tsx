"use client";

import { Plus } from "lucide-react";
import { SOCIALS } from "@/components/site/social-icons";
import { SOCIAL_PLATFORMS, type Site, type SocialPlatform } from "@/lib/types";
import { Button, Card, DeleteButton, EmptyState, Field, ImageInput, Select, SortableList, TextArea, TextInput, Toggle, uid } from "./ui";

export type SectionProps = { site: Site; update: (fn: (s: Site) => Site) => void };

export function ProfileSection({ site, update }: SectionProps) {
  const p = site.profile;
  const set = (patch: Partial<Site["profile"]>) => update((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  return (
    <div className="space-y-5">
      <Card title="Profile" description="The top of your page.">
        <div className="space-y-4">
          <Field label="Profile picture">
            <ImageInput value={p.avatarUrl} onChange={(avatarUrl) => set({ avatarUrl })} shape="circle" maxSize={600} />
          </Field>
          <Field label="Name">
            <TextInput value={p.name} onChange={(name) => set({ name })} maxLength={80} />
          </Field>
          <Field label="Tagline" hint="One short line under your name.">
            <TextInput value={p.tagline} onChange={(tagline) => set({ tagline })} maxLength={120} />
          </Field>
          <Field label="Bio" hint="Optional. Line breaks are kept.">
            <TextArea value={p.bio} onChange={(bio) => set({ bio })} maxLength={500} />
          </Field>
        </div>
      </Card>
    </div>
  );
}

export function SocialsSection({ site, update }: SectionProps) {
  const setSocials = (socials: Site["socials"]) => update((s) => ({ ...s, socials }));
  const used = new Set(site.socials.map((s) => s.platform));
  const next = SOCIAL_PLATFORMS.find((p) => !used.has(p)) ?? "website";

  return (
    <Card
      title="Social icons"
      description="Icons under your name. Drag to reorder."
      actions={
        <Button
          variant="primary"
          onClick={() => setSocials([...site.socials, { id: uid("s"), platform: next, url: "", enabled: true }])}
        >
          <Plus className="size-4" /> Add
        </Button>
      }
    >
      {site.socials.length === 0 ? (
        <EmptyState>No social icons yet. Click Add.</EmptyState>
      ) : (
        <SortableList
          items={site.socials}
          onChange={setSocials}
          render={(item, handle) => {
            const Icon = SOCIALS[item.platform].icon;
            const patch = (p: Partial<typeof item>) => setSocials(site.socials.map((s) => (s.id === item.id ? { ...s, ...p } : s)));
            return (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-50 p-2 ring-1 ring-zinc-200/70 sm:flex-nowrap">
                {handle}
                <Icon className="size-5 shrink-0 text-zinc-700" />
                <div className="w-36 shrink-0">
                  <Select
                    value={item.platform}
                    onChange={(platform: SocialPlatform) => patch({ platform })}
                    options={SOCIAL_PLATFORMS.map((p) => ({ value: p, label: SOCIALS[p].label }))}
                  />
                </div>
                <TextInput
                  value={item.url}
                  onChange={(url) => patch({ url })}
                  placeholder={SOCIALS[item.platform].placeholder}
                  className="min-w-0 flex-1 basis-48"
                />
                <Toggle checked={item.enabled} onChange={(enabled) => patch({ enabled })} label="Visible" />
                <DeleteButton label="" onConfirm={() => setSocials(site.socials.filter((s) => s.id !== item.id))} />
              </div>
            );
          }}
        />
      )}
    </Card>
  );
}
