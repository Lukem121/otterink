"use client";

import { Check } from "lucide-react";
import { FONT_LABELS, PRESETS, fontVar, presetTheme } from "@/lib/themes";
import { FONTS, type FontKey, type Theme } from "@/lib/types";
import type { SectionProps } from "./sections-profile";
import { Card, ColorInput, Field, ImageInput, ToggleRow } from "./ui";

export function ThemeSection({ site, update }: SectionProps) {
  const t = site.theme;
  const set = (patch: Partial<Theme>) => update((s) => ({ ...s, theme: { ...s.theme, ...patch, preset: patch.preset ?? "custom" } }));

  return (
    <div className="space-y-5">
      <Card title="Presets" description="Start from a preset, then tweak anything below.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => update((s) => ({ ...s, theme: { ...presetTheme(key), bgImageUrl: s.theme.bgImageUrl } }))}
              className={`relative overflow-hidden rounded-xl text-left ring-2 transition ${t.preset === key ? "ring-zinc-900" : "ring-transparent hover:ring-zinc-300"}`}
            >
              <div className="flex h-24 flex-col items-center justify-center gap-1.5 p-3" style={{ background: `linear-gradient(180deg, ${p.bgFrom}, ${p.bgTo})` }}>
                <div className="h-3 w-3/4" style={{ background: p.cardBg, borderRadius: p.radius, boxShadow: p.buttonStyle === "outline" ? `inset 0 0 0 1.5px ${p.text}` : undefined }} />
                <div className="h-3 w-3/4" style={{ background: p.cardBg, borderRadius: p.radius, boxShadow: p.buttonStyle === "outline" ? `inset 0 0 0 1.5px ${p.text}` : undefined }} />
                <div className="h-3 w-1/2 rounded-full" style={{ background: p.accent }} />
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-2 text-[13px] font-medium" style={{ fontFamily: fontVar(p.headingFont) }}>
                {p.name}
                {t.preset === key && <Check className="size-4" />}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Background">
        <div className="space-y-4">
          <Segmented
            value={t.bgType}
            onChange={(bgType) => set({ bgType })}
            options={[
              { value: "gradient", label: "Gradient" },
              { value: "solid", label: "Solid" },
              { value: "image", label: "Image" },
            ]}
          />
          {t.bgType === "image" ? (
            <Field label="Background image">
              <ImageInput value={t.bgImageUrl} onChange={(bgImageUrl) => set({ bgImageUrl })} shape="wide" maxSize={1800} />
            </Field>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorInput label={t.bgType === "gradient" ? "Top colour" : "Colour"} value={t.bgFrom} onChange={(bgFrom) => set({ bgFrom })} />
              {t.bgType === "gradient" && <ColorInput label="Bottom colour" value={t.bgTo} onChange={(bgTo) => set({ bgTo })} />}
            </div>
          )}
          {t.bgType !== "image" && <ToggleRow label="Wave shape" hint="Soft curve behind your header." checked={t.wave} onChange={(wave) => set({ wave })} />}
        </div>
      </Card>

      <Card title="Colours">
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorInput label="Text" value={t.text} onChange={(text) => set({ text })} />
          <ColorInput label="Soft text" value={t.muted} onChange={(muted) => set({ muted })} />
          <ColorInput label="Card background" value={t.cardBg} onChange={(cardBg) => set({ cardBg })} />
          <ColorInput label="Card text" value={t.cardText} onChange={(cardText) => set({ cardText })} />
          <ColorInput label="Accent (badges, avatar)" value={t.accent} onChange={(accent) => set({ accent })} />
          <ColorInput label="Text on accent" value={t.accentText} onChange={(accentText) => set({ accentText })} />
        </div>
      </Card>

      <Card title="Fonts">
        <div className="grid gap-4 sm:grid-cols-2">
          <FontPicker label="Headings" value={t.headingFont} onChange={(headingFont) => set({ headingFont })} />
          <FontPicker label="Body" value={t.font} onChange={(font) => set({ font })} />
        </div>
      </Card>

      <Card title="Cards & buttons">
        <div className="space-y-4">
          <Field label="Style">
            <Segmented
              value={t.buttonStyle}
              onChange={(buttonStyle) => set({ buttonStyle })}
              options={[
                { value: "soft", label: "Soft" },
                { value: "filled", label: "Filled" },
                { value: "outline", label: "Outline" },
                { value: "glass", label: "Glass" },
              ]}
            />
          </Field>
          <Field label={`Corner roundness: ${t.radius}px`}>
            <input type="range" min={0} max={36} value={t.radius} onChange={(e) => set({ radius: Number(e.target.value) })} className="w-full accent-zinc-900" />
          </Field>
          <ToggleRow label="Drop shadow" checked={t.shadow} onChange={(shadow) => set({ shadow })} />
        </div>
      </Card>
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition ${value === o.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FontPicker({ label, value, onChange }: { label: string; value: FontKey; onChange: (v: FontKey) => void }) {
  return (
    <Field label={label}>
      <div className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-zinc-200 p-1.5">
        {FONTS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-[16px] transition ${value === f ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"}`}
            style={{ fontFamily: fontVar(f) }}
          >
            {FONT_LABELS[f]}
            {value === f && <Check className="size-4" />}
          </button>
        ))}
      </div>
    </Field>
  );
}
