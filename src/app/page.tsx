import type { Metadata } from "next";
import { SiteView } from "@/components/site/site-view";
import { getPublishedSite } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublishedSite();
  const title = site.seo.title || site.profile.name;
  const description = site.seo.description || site.profile.tagline || site.profile.bio;
  const images = site.profile.avatarUrl ? [site.profile.avatarUrl] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, images, type: "profile" },
    twitter: { card: "summary", title, description, images },
    icons: site.profile.avatarUrl ? { icon: site.profile.avatarUrl, apple: site.profile.avatarUrl } : undefined,
  };
}

export default async function Home() {
  const site = await getPublishedSite();
  return <SiteView site={site} />;
}
