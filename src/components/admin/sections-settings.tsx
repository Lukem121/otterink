"use client";

import { Download, LogOut, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { logout } from "@/app/admin/actions";
import { normalizeSite } from "@/lib/defaults";
import { SiteSchema, type Site } from "@/lib/types";
import type { SectionProps } from "./sections-profile";
import { Button, Card, Field, TextArea, TextInput } from "./ui";

export function SettingsSection({ site, update, storage }: SectionProps & { storage: { mode: string; writable: boolean; blob: boolean } }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const setSeo = (patch: Partial<Site["seo"]>) => update((s) => ({ ...s, seo: { ...s.seo, ...patch } }));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(site, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `link-page-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = SiteSchema.safeParse(normalizeSite(JSON.parse(await file.text())));
      if (!parsed.success) return setMsg("That file isn't a valid backup.");
      update(() => parsed.data);
      setMsg("Backup loaded. Click Save to publish it.");
    } catch {
      setMsg("Couldn't read that file.");
    }
  };

  return (
    <div className="space-y-5">
      <Card title="Search & sharing" description="How your page looks in Google and when shared in messages.">
        <div className="space-y-4">
          <Field label="Page title" hint="Leave empty to use your name.">
            <TextInput value={site.seo.title} onChange={(title) => setSeo({ title })} placeholder={site.profile.name} maxLength={120} />
          </Field>
          <Field label="Description" hint="Leave empty to use your tagline.">
            <TextArea value={site.seo.description} onChange={(description) => setSeo({ description })} placeholder={site.profile.tagline} rows={2} maxLength={300} />
          </Field>
        </div>
      </Card>

      <Card title="Backup" description="Download everything as a file, or restore from one.">
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJson}>
            <Download className="size-4" /> Download backup
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Restore backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
        </div>
        {msg && <p className="mt-3 text-[13px] text-zinc-600">{msg}</p>}
      </Card>

      <Card title="Status">
        <ul className="space-y-1.5 text-[13px] text-zinc-700">
          <li>
            Content storage:{" "}
            <b>{storage.mode === "redis" ? "Upstash Redis ✓" : storage.writable ? "Local file (development)" : "Not connected. Add Upstash Redis in Vercel."}</b>
          </li>
          <li>
            Image storage: <b>{storage.blob ? "Vercel Blob ✓" : storage.writable && storage.mode === "file" ? "Local folder (development)" : "Not connected. Add a Blob store in Vercel."}</b>
          </li>
        </ul>
      </Card>

      <form action={logout}>
        <Button type="submit" variant="secondary">
          <LogOut className="size-4" /> Log out
        </Button>
      </form>
    </div>
  );
}
