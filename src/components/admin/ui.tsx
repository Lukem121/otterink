"use client";
/* eslint-disable @next/next/no-img-element -- previews of uploaded or remote images */

import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, ImageOff, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { uploadImage } from "@/app/admin/actions";

export function Card({ title, description, actions, children }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-black/[0.06] sm:p-6">
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-zinc-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-zinc-500">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[14px] text-zinc-900 shadow-[0_1px_1px_rgb(0_0_0/0.02)] outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";

export function TextInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & { value: string; onChange: (v: string) => void }) {
  const { onChange, className, ...rest } = props;
  return <input {...rest} className={`${inputCls} ${className ?? ""}`} onChange={(e) => onChange(e.target.value)} />;
}

export function TextArea(props: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & { value: string; onChange: (v: string) => void }) {
  const { onChange, className, ...rest } = props;
  return <textarea rows={3} {...rest} className={`${inputCls} resize-y ${className ?? ""}`} onChange={(e) => onChange(e.target.value)} />;
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="relative">
      <select className={`${inputCls} cursor-pointer appearance-none pr-9`} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-emerald-500" : "bg-zinc-300"}`}
    >
      <span className={`inline-block size-5 rounded-full bg-white shadow transition ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <div className="text-[14px] font-medium text-zinc-800">{label}</div>
        {hint && <div className="text-[12px] text-zinc-500">{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function Button({
  children,
  variant = "secondary",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const v = {
    primary: "bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 disabled:bg-zinc-400",
    secondary: "bg-white text-zinc-800 shadow-[0_1px_1px_rgb(0_0_0/0.03)] ring-1 ring-black/10 hover:bg-zinc-50",
    ghost: "text-zinc-600 hover:bg-zinc-100",
    danger: "text-red-600 hover:bg-red-50",
  }[variant];
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed ${v} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-2.5 py-2">
      <label htmlFor={id} className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10" style={{ background: value }}>
        <input id={id} type="color" value={toHex(value)} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-zinc-500">{label}</div>
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent font-mono text-[13px] text-zinc-800 outline-none" />
      </div>
    </div>
  );
}

function toHex(v: string) {
  return /^#[0-9a-f]{6}$/i.test(v) ? v : "#000000";
}

/** Shrinks big photos to WebP in the browser before upload. */
async function compress(file: File, maxSize: number): Promise<File> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
  } catch {
    return file;
  }
}

export function ImageInput({
  value,
  onChange,
  shape = "square",
  maxSize = 1200,
  allowUrl = true,
}: {
  value: string;
  onChange: (url: string) => void;
  shape?: "square" | "circle" | "wide";
  maxSize?: number;
  allowUrl?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const prepared = await compress(file, maxSize);
      if (prepared.size > 4 * 1024 * 1024) {
        setError(`That image is ${(prepared.size / 1048576).toFixed(1)} MB. The limit is 4 MB, so try a smaller photo or a screenshot of it.`);
        return;
      }
      const fd = new FormData();
      fd.set("file", prepared);
      const res = await uploadImage(fd);
      if ("error" in res) setError(res.error);
      else onChange(res.url);
    } catch (e) {
      setError(`Upload failed${e instanceof Error && e.message ? `: ${e.message.slice(0, 120)}` : ""}. Try again, or paste an image link instead.`);
    } finally {
      setBusy(false);
    }
  }

  const box = shape === "circle" ? "size-20 rounded-full" : shape === "wide" ? "h-20 w-36 rounded-xl" : "size-20 rounded-xl";

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files[0]);
        }}
        className={`group relative grid shrink-0 place-items-center overflow-hidden border-2 border-dashed bg-zinc-50 text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-600 ${box} ${drag ? "border-emerald-500 bg-emerald-50" : "border-zinc-200"} ${value ? "border-solid" : ""}`}
        aria-label="Upload image"
      >
        {value && brokenSrc !== value ? (
          <img
            src={value}
            alt=""
            onError={() => setBrokenSrc(value)}
            className={`absolute inset-0 size-full bg-white ${shape === "circle" ? "object-cover" : "object-contain p-1"}`}
          />
        ) : value ? (
          <ImageOff className="size-5" />
        ) : (
          <ImagePlus className="size-6" />
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-5 animate-spin text-zinc-700" />
          </span>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files?.[0])} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => ref.current?.click()} disabled={busy}>
            {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button variant="ghost" onClick={() => onChange("")}>
              <X className="size-4" /> Remove
            </Button>
          )}
        </div>
        {allowUrl && <TextInput value={value} onChange={onChange} placeholder="…or paste an image URL" className="!py-1.5 !text-[12px]" />}
        {error && <p className="text-[12px] text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onChange,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, handle: ReactNode) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    onChange(arrayMove(items, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {(handle) => render(item, handle)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      <GripVertical className="size-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={isDragging ? "relative rounded-2xl shadow-2xl ring-2 ring-emerald-500/40" : "relative"}
    >
      {children(handle)}
    </div>
  );
}

export function DeleteButton({ onConfirm, label = "Delete" }: { onConfirm: () => void; label?: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <Button
      variant="danger"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
      aria-label={label}
    >
      <Trash2 className="size-4" />
      {armed ? "Click again to delete" : label}
    </Button>
  );
}

export function EmptyState({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 px-4 py-10 text-center text-[13px] text-zinc-500">
      {icon && <span className="grid size-11 place-items-center rounded-2xl bg-white text-zinc-400 shadow-sm ring-1 ring-black/5">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

/** Shared look for a draggable list row. */
export const rowCls = "rounded-2xl bg-white ring-1 ring-black/[0.07] shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition hover:ring-black/[0.12]";

/** Small thumbnail that falls back to an icon if the image fails to load. */
export function Thumb({ src, fallback, round = false }: { src: string; fallback: ReactNode; round?: boolean }) {
  const [broken, setBroken] = useState<string | null>(null);
  const shape = round ? "rounded-full" : "rounded-xl";
  if (src && broken !== src) {
    return <img src={src} alt="" onError={() => setBroken(src)} className={`size-11 shrink-0 bg-white object-contain ring-1 ring-black/5 ${shape}`} />;
  }
  return <span className={`grid size-11 shrink-0 place-items-center bg-zinc-50 text-zinc-400 ring-1 ring-black/5 ${shape}`}>{fallback}</span>;
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
