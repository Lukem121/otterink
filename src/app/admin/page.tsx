import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Editor } from "@/components/admin/editor";
import { isAdmin } from "@/lib/auth";
import { readSite, storageMode, storageWritable } from "@/lib/store";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-sm text-zinc-500">Loading…</div>}>
      <AdminLoader />
    </Suspense>
  );
}

async function AdminLoader() {
  if (!(await isAdmin())) redirect("/admin/login");
  const site = await readSite();
  return (
    <Editor
      initial={site}
      storage={{ mode: storageMode, writable: storageWritable, blob: !!process.env.BLOB_READ_WRITE_TOKEN }}
    />
  );
}
