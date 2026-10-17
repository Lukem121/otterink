# Link page

A personal link-in-bio page (like Linktree) with a private admin editor.

- **Public page** (`/`): profile, social icons, Links tab, and a Shop tab with a product grid, search, and collections.
- **Admin** (`/admin`): edit everything with a live phone preview, drag-and-drop ordering, image uploads, theme editor, analytics, and JSON backup/restore.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000/admin. The password is `admin` until you set `ADMIN_PASSWORD`.
Local content is saved to `.data/` (git-ignored).

## Deploy to Vercel

1. Import this repo at vercel.com/new.
2. In the project, open **Storage**:
   - Create **Upstash for Redis** (free tier) and connect it to the project. This stores your content and analytics.
   - Create a **Blob** store and connect it. This stores uploaded images.
3. In **Settings → Environment Variables**, add `ADMIN_PASSWORD`.
4. Redeploy, then go to `https://your-domain/admin`.

## How it works

| Piece | Where |
| --- | --- |
| Data shape and validation | `src/lib/types.ts` |
| Storage (Redis, or a file locally) | `src/lib/store.ts` |
| Login (signed cookie, single admin) | `src/lib/session.ts`, `src/proxy.ts`, `src/app/admin/actions.ts` |
| Public page UI | `src/components/site/site-view.tsx` |
| Admin editor | `src/components/admin/` |
| Theme presets and fonts | `src/lib/themes.ts`, `src/lib/fonts.ts` |

The public page is cached and refreshed every time you click **Save**.
Clicks are counted with a background beacon, so affiliate links stay as the original URLs (no redirect).

Tip: add `?utm_source=instagram` (or `tiktok`, etc.) to the link you put in each bio, so analytics can tell where visitors came from.
