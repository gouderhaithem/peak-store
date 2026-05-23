/**
 * Supabase implementation of HomeContentRepository.
 *
 * Reads use the anonymous public client — RLS only exposes active rows.
 * Writes go through the auth'd browser client so the admin's session
 * cookies carry the is_admin() check.
 */

import { getPublicClient } from "@/lib/supabase/public";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type {
  HomeContentRepository,
  HomeSection,
  HomeSectionKind,
  HomeSectionSlug,
  LocalizedText,
  UpdateHomeSectionInput,
} from "@/lib/repository/homeContent";

interface HomeContentRow {
  slug: HomeSectionSlug;
  kind: HomeSectionKind;
  position: number;
  title_fr: string;
  title_en: string;
  title_ar: string;
  accent_fr: string | null;
  accent_en: string | null;
  accent_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  description_ar: string | null;
  cta_label_fr: string | null;
  cta_label_en: string | null;
  cta_label_ar: string | null;
  cta_href: string;
  image_path: string | null;
  is_active: boolean;
}

const COLUMNS =
  "slug,kind,position,title_fr,title_en,title_ar,accent_fr,accent_en,accent_ar,description_fr,description_en,description_ar,cta_label_fr,cta_label_en,cta_label_ar,cta_href,image_path,is_active";

function buildImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/product-images/${path}`;
}

function mapRow(row: HomeContentRow): HomeSection {
  const accent: LocalizedText | null =
    row.accent_fr || row.accent_en || row.accent_ar
      ? {
          fr: row.accent_fr ?? "",
          en: row.accent_en ?? "",
          ar: row.accent_ar ?? "",
        }
      : null;

  const description: LocalizedText | null =
    row.description_fr || row.description_en || row.description_ar
      ? {
          fr: row.description_fr ?? "",
          en: row.description_en ?? "",
          ar: row.description_ar ?? "",
        }
      : null;

  const ctaLabel: LocalizedText | null =
    row.cta_label_fr || row.cta_label_en || row.cta_label_ar
      ? {
          fr: row.cta_label_fr ?? "",
          en: row.cta_label_en ?? "",
          ar: row.cta_label_ar ?? "",
        }
      : null;

  return {
    slug: row.slug,
    kind: row.kind,
    position: row.position,
    title: { fr: row.title_fr, en: row.title_en, ar: row.title_ar },
    accent,
    description,
    ctaLabel,
    ctaHref: row.cta_href,
    imageUrl: buildImageUrl(row.image_path),
    isActive: row.is_active,
  };
}

// Pulls the bucket-relative path out of a public storage URL so an admin
// who re-saves without changing the image doesn't pin the absolute URL
// (which would break if the bucket ever moves). Returns null when the URL
// doesn't look like one of ours — e.g. an external CDN URL — in which
// case we store it verbatim.
function extractStoragePath(url: string): string {
  const m = url.match(
    /\/storage\/v1\/object\/public\/product-images\/([^?]+)/
  );
  return m ? m[1] : url;
}

export const supabaseHomeContentRepo: HomeContentRepository = {
  async list() {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("home_content")
      .select(COLUMNS)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row as HomeContentRow));
  },

  async listForAdmin() {
    // Auth'd client: RLS lets admins see inactive rows too.
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("home_content")
      .select(COLUMNS)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row as HomeContentRow));
  },

  async findBySlug(slug: HomeSectionSlug) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("home_content")
      .select(COLUMNS)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapRow(data as HomeContentRow);
  },

  async update(slug: HomeSectionSlug, input: UpdateHomeSectionInput) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("home_content")
      .update({
        title_fr: input.title.fr,
        title_en: input.title.en,
        title_ar: input.title.ar,
        accent_fr: input.accent?.fr || null,
        accent_en: input.accent?.en || null,
        accent_ar: input.accent?.ar || null,
        description_fr: input.description?.fr || null,
        description_en: input.description?.en || null,
        description_ar: input.description?.ar || null,
        cta_label_fr: input.ctaLabel?.fr || null,
        cta_label_en: input.ctaLabel?.en || null,
        cta_label_ar: input.ctaLabel?.ar || null,
        cta_href: input.ctaHref || "/shop",
        image_path: input.imageUrl ? extractStoragePath(input.imageUrl) : null,
        is_active: input.isActive,
      })
      .eq("slug", slug)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return mapRow(data as HomeContentRow);
  },
};
