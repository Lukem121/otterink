"use client";

import { useRef, useState, type ReactNode } from "react";
import type { DayPoint } from "@/lib/analytics-types";

/* Chart colours follow the data-viz palette: slot 1 blue, slot 2 orange (validated together). */
export const BLUE = "#2a78d6";
export const ORANGE = "#eb6834";
const GRID = "#e7e5e4";
const AXIS = "#78716c";

export const nf = new Intl.NumberFormat("en");
export const compact = (n: number) =>
  n >= 10_000 ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n) : nf.format(n);

/** 1 / 2 / 5 × 10ⁿ, so the axis ticks land on clean numbers. */
function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}

const dayLabel = (d: string, long = false) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(long ? { weekday: "short" } : {}), timeZone: "UTC" });

/** Page views as bars, clicks as a line, on one shared axis. */
export function TrendChart({ data }: { data: DayPoint[] }) {
  const W = 640;
  const H = 240;
  const pad = { l: 40, r: 12, t: 14, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = data.length;
  const step = niceStep(Math.max(1, ...data.map((d) => Math.max(d.views, d.clicks))) / 4);
  const max = step * 4;
  const slot = iw / n;
  const bw = Math.min(24, Math.max(2, slot * 0.62));
  const x = (i: number) => pad.l + slot * (i + 0.5);
  const y = (v: number) => pad.t + ih - (v / max) * ih;

  const [hover, setHover] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const idxFromPointer = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W - pad.l;
    return Math.min(n - 1, Math.max(0, Math.floor(px / slot)));
  };

  const bar = (i: number, v: number) => {
    if (v <= 0) return null;
    const h = (v / max) * ih;
    const r = Math.min(4, bw / 2, h);
    const x0 = x(i) - bw / 2;
    const y0 = pad.t + ih;
    return `M${x0},${y0} V${y0 - h + r} a${r},${r} 0 0 1 ${r},${-r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${y0} Z`;
  };

  const labelEvery = Math.max(1, Math.round(n / 6));
  const line = data.map((d, i) => `${x(i)},${y(d.clicks)}`).join(" ");
  const h = hover == null ? null : data[hover];
  const flip = hover != null && hover > n * 0.6;

  return (
    <div
      ref={wrap}
      className="relative"
      onPointerMove={(e) => setHover(idxFromPointer(e.clientX))}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-pan-y select-none"
        role="img"
        aria-label="Daily page views and clicks"
        tabIndex={0}
        onFocus={() => setHover((v) => v ?? n - 1)}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? n) - 1));
          if (e.key === "ArrowRight") setHover((v) => Math.min(n - 1, (v ?? -1) + 1));
        }}
      >
        {[0, 1, 2, 3, 4].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(step * t)} y2={y(step * t)} stroke={GRID} strokeWidth={1} />
            <text x={pad.l - 8} y={y(step * t) + 4} textAnchor="end" fontSize={11} fill={AXIS}>
              {compact(step * t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <path key={d.day} d={bar(i, d.views) ?? ""} fill={BLUE} opacity={hover == null || hover === i ? 1 : 0.55} />
        ))}
        <polyline points={line} fill="none" stroke={ORANGE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={d.day} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill={AXIS}>
              {dayLabel(d.day)}
            </text>
          ) : null,
        )}
        {hover != null && h && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#a8a29e" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.clicks)} r={4} fill={ORANGE} stroke="#fff" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hover != null && h && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-xl bg-white px-3 py-2 text-[12px] shadow-lg ring-1 ring-black/10"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${flip ? "calc(-100% - 12px)" : "12px"})` }}
        >
          <div className="mb-1 font-medium text-zinc-500">{dayLabel(h.day, true)}</div>
          <Row color={BLUE} label="Page views" value={h.views} />
          <Row color={ORANGE} label="Clicks" value={h.clicks} line />
          <div className="mt-1 text-zinc-500">{nf.format(h.visitors)} visitor{h.visitors === 1 ? "" : "s"}</div>
        </div>
      )}
    </div>
  );
}

function Row({ color, label, value, line }: { color: string; label: string; value: number; line?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-zinc-600">
        <span className={line ? "h-0.5 w-3 rounded-full" : "h-2 w-3 rounded-[2px]"} style={{ background: color }} />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-zinc-900">{nf.format(value)}</span>
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex items-center gap-4 text-[12px] text-zinc-600">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-3 rounded-[2px]" style={{ background: BLUE }} /> Page views
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-3 rounded-full" style={{ background: ORANGE }} /> Clicks
      </span>
    </div>
  );
}

/** Tooltip that shows on hover and keyboard focus without any script. */
export function Tip({ label, children, className = "" }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div tabIndex={0} className={`group relative outline-none ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[12px] text-white shadow-lg group-hover:block group-focus-visible:block"
      >
        {label}
      </span>
    </div>
  );
}

/** Column chart for hour-of-day and day-of-week. One series, so no legend. */
export function Columns({
  values,
  labels,
  color,
  tip,
  labelEvery = 1,
}: {
  values: number[];
  labels: string[];
  color: string;
  tip: (i: number, v: number) => string;
  labelEvery?: number;
}) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <div className="flex h-24 items-end gap-[2px]">
        {values.map((v, i) => (
          <Tip key={i} label={tip(i, v)} className="flex h-full min-w-0 flex-1 items-end justify-center">
            <div
              className="w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80"
              style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 1, background: v ? color : GRID }}
            />
          </Tip>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px] text-[11px] text-zinc-500">
        {labels.map((l, i) => (
          <span key={i} className="min-w-0 flex-1 text-center">
            {i % labelEvery === 0 ? l : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Tiny trend line for the stat tiles. */
export function Spark({ values }: { values: number[] }) {
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${h - 3 - (v / max) * (h - 8)}`).join(" ");
  const last = values.length - 1;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24" aria-hidden>
      <polyline points={pts} fill="none" stroke="#a8a29e" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {last >= 0 && <circle cx={w} cy={h - 3 - (values[last] / max) * (h - 8)} r={3.5} fill={BLUE} stroke="#fff" strokeWidth={2} />}
    </svg>
  );
}
