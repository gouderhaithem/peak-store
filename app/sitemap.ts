import type { MetadataRoute } from "next";
import { getPublicClient } from "@/lib/supabase/public";

const BASE = "https://peakstore.dz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE}/shop`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE}/promo`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE}/contact`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${BASE}/about`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/faq`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/shipping`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/returns`, priority: 0.5, changeFrequency: "monthly" },
  ];

  // Pull active product IDs for individual product pages
  try {
    const supabase = getPublicClient();
    const { data } = await supabase
      .from("products")
      .select("id,updated_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const productPages: MetadataRoute.Sitemap = (data ?? []).map((row) => ({
      url: `${BASE}/shop/${row.id}`,
      lastModified: row.updated_at ? new Date(row.updated_at as string) : undefined,
      priority: 0.8,
      changeFrequency: "weekly" as const,
    }));

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
