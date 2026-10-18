import type { ReactNode } from "react";

/** Small line icons for shop categories. 24×24, drawn in currentColor so they follow the theme. */
export const CATEGORY_ICONS = {
  book: {
    label: "Book",
    paths: (
      <>
        <path d="M12 6.8C10 5.3 7.2 4.8 4 5.2v13c3.2-.4 6 .1 8 1.6 2-1.5 4.8-2 8-1.6v-13c-3.2-.4-6 .1-8 1.6Z" fill="currentColor" fillOpacity={0.14} />
        <path d="M12 6.8v13" />
      </>
    ),
  },
  marker: {
    label: "Marker",
    paths: (
      <g transform="rotate(40 12 12)">
        <rect x="8.5" y="2.5" width="7" height="14" rx="1.8" fill="currentColor" fillOpacity={0.14} />
        <path d="M8.5 7.5h7" />
        <path d="M9.8 16.5h4.4l-1 3.8h-2.4Z" />
      </g>
    ),
  },
  pencil: {
    label: "Pencil",
    paths: (
      <>
        <path d="M15.5 4.5a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L9 19l-4.5 1 1-4.5Z" fill="currentColor" fillOpacity={0.14} />
        <path d="m14 6 4 4" />
        <path d="m5.5 15.5 3 3" />
      </>
    ),
  },
  brush: {
    label: "Paintbrush",
    paths: (
      <>
        <path d="M19.5 4.5 11 13" />
        <path d="M11 13c1.2 1.2 1.2 3 0 4.2-1.5 1.5-4.5 1.8-6.5 1.3.8-.9 1-2 1-3.2 0-1.4 1-2.8 2.4-3 1.2-.2 2.3.1 3.1.7Z" fill="currentColor" fillOpacity={0.14} />
      </>
    ),
  },
  palette: {
    label: "Palette",
    paths: (
      <>
        <path d="M12 3.5c-4.9 0-8.5 3.7-8.5 8.3 0 4.6 3.7 8.7 8.4 8.7 1.3 0 1.9-1 1.4-2.1-.6-1.3.1-2.5 1.6-2.5h2c2.3 0 4.1-1.6 4.1-4 0-4.6-4-8.4-9-8.4Z" fill="currentColor" fillOpacity={0.14} />
        <circle cx="7.8" cy="11.2" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="10.3" cy="7.6" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="14.6" cy="7.6" r="1.3" fill="currentColor" stroke="none" />
      </>
    ),
  },
  notebook: {
    label: "Notebook",
    paths: (
      <>
        <rect x="6" y="3.5" width="13" height="17" rx="2" fill="currentColor" fillOpacity={0.14} />
        <path d="M4.5 8h3M4.5 12h3M4.5 16h3" />
        <path d="M11 8.5h4.5" />
      </>
    ),
  },
  sticker: {
    label: "Sticker",
    paths: (
      <>
        <path d="M20 12.5V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h5.5Z" fill="currentColor" fillOpacity={0.14} />
        <path d="M20 12.5c-4.4 0-7.5 3.1-7.5 7.5" />
        <circle cx="9" cy="9.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="14" cy="9.5" r="1" fill="currentColor" stroke="none" />
        <path d="M8.8 13.3c.8 1 1.8 1.4 2.9 1.4" />
      </>
    ),
  },
  scissors: {
    label: "Scissors",
    paths: (
      <>
        <circle cx="6.5" cy="6.5" r="2.8" fill="currentColor" fillOpacity={0.14} />
        <circle cx="6.5" cy="17.5" r="2.8" fill="currentColor" fillOpacity={0.14} />
        <path d="M8.7 8.3 20 18.5M8.7 15.7 20 5.5" />
      </>
    ),
  },
  heart: {
    label: "Heart",
    paths: (
      <path
        d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z"
        fill="currentColor"
        fillOpacity={0.14}
      />
    ),
  },
  sparkle: {
    label: "Sparkle",
    paths: (
      <>
        <path d="M11 4c.7 4.2 2.3 5.8 6.5 6.5-4.2.7-5.8 2.3-6.5 6.5-.7-4.2-2.3-5.8-6.5-6.5C8.7 9.8 10.3 8.2 11 4Z" fill="currentColor" fillOpacity={0.14} />
        <path d="M18 15.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z" />
      </>
    ),
  },
  flower: {
    label: "Flower",
    paths: (
      <>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="12" cy="7" rx="2.7" ry="3.6" transform={`rotate(${a} 12 12)`} fill="currentColor" fillOpacity={0.14} />
        ))}
        <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      </>
    ),
  },
  gift: {
    label: "Gift",
    paths: (
      <>
        <rect x="4.5" y="10" width="15" height="10" rx="1.5" fill="currentColor" fillOpacity={0.14} />
        <path d="M3.5 7.5h17v2.5h-17Z" />
        <path d="M12 7.5V20" />
        <path d="M12 7.5c-1-2.6-4.5-3.4-4.5-1.3 0 1 1.5 1.3 4.5 1.3Zm0 0c1-2.6 4.5-3.4 4.5-1.3 0 1-1.5 1.3-4.5 1.3Z" />
      </>
    ),
  },
  mug: {
    label: "Mug",
    paths: (
      <>
        <path d="M4.5 9h11v6.5a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4Z" fill="currentColor" fillOpacity={0.14} />
        <path d="M15.5 11h1.3a2.3 2.3 0 0 1 0 4.6h-1.5" />
        <path d="M8 3.5c-.6.8-.6 1.7 0 2.5M11.5 3.5c-.6.8-.6 1.7 0 2.5" />
      </>
    ),
  },
  bag: {
    label: "Shopping bag",
    paths: (
      <>
        <path d="M5.5 8h13l-1 12H6.5Z" fill="currentColor" fillOpacity={0.14} />
        <path d="M9 10V7a3 3 0 0 1 6 0v3" />
      </>
    ),
  },
} satisfies Record<string, { label: string; paths: ReactNode }>;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;
export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS) as CategoryIconKey[];

const GUESSES: [RegExp, CategoryIconKey][] = [
  [/book|colou?ring|read/i, "book"],
  [/marker|pen\b|pens|ink/i, "marker"],
  [/pencil|crayon/i, "pencil"],
  [/brush|paint/i, "brush"],
  [/palette|art|suppl/i, "palette"],
  [/journal|notebook|planner|diary/i, "notebook"],
  [/sticker/i, "sticker"],
  [/craft|scissor|tool/i, "scissors"],
  [/gift|present/i, "gift"],
  [/fav|love|best/i, "heart"],
  [/new|special|deal|sale/i, "sparkle"],
  [/cozy|cosy|home|mug|tea|coffee/i, "mug"],
  [/flower|daisy|spring|garden/i, "flower"],
];

/** The chosen icon, or one guessed from the category name. */
export function categoryIcon(icon: string, title: string): CategoryIconKey {
  if (icon in CATEGORY_ICONS) return icon as CategoryIconKey;
  return GUESSES.find(([re]) => re.test(title))?.[1] ?? "bag";
}

export function CategoryIcon({ name, className = "size-5" }: { name: CategoryIconKey; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {CATEGORY_ICONS[name].paths}
    </svg>
  );
}
