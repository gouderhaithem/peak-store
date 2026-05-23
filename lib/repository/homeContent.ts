/**
 * Home content repository.
 *
 * Drives the editable parts of the homepage: hero + 4 lifestyle sections.
 * The set of slugs is fixed by migration 0015 — the admin edits text,
 * image, and visibility but cannot add or remove rows.
 *
 * UI shape stores every text field as a `{fr, en, ar}` triple so the
 * components can pick the right locale at render time. The repository
 * abstracts the column-per-locale storage in the DB.
 */

import type { Locale } from "@/lib/i18n";

export type HomeSectionKind = "hero" | "lifestyle";

export type HomeSectionSlug =
  | "hero"
  | "apparel"
  | "performance"
  | "kids"
  | "promotion";

export interface LocalizedText {
  fr: string;
  en: string;
  ar: string;
}

export interface HomeSection {
  slug: HomeSectionSlug;
  kind: HomeSectionKind;
  position: number;
  title: LocalizedText;
  // Optional secondary accent line under the title (hero uses it, lifestyle
  // sections leave it empty).
  accent: LocalizedText | null;
  description: LocalizedText | null;
  ctaLabel: LocalizedText | null;
  ctaHref: string;
  // Absolute URL (resolved from the storage path). Null when the admin
  // hasn't uploaded an image yet — components show a placeholder.
  imageUrl: string | null;
  isActive: boolean;
}

export interface UpdateHomeSectionInput {
  title: LocalizedText;
  accent: LocalizedText | null;
  description: LocalizedText | null;
  ctaLabel: LocalizedText | null;
  ctaHref: string;
  imageUrl: string | null;
  isActive: boolean;
}

export interface HomeContentRepository {
  // Public read — only returns active rows for non-admins. Admin callers
  // hit `listForAdmin()` instead so they can edit inactive ones.
  list(): Promise<HomeSection[]>;
  listForAdmin(): Promise<HomeSection[]>;
  findBySlug(slug: HomeSectionSlug): Promise<HomeSection | null>;
  update(
    slug: HomeSectionSlug,
    input: UpdateHomeSectionInput
  ): Promise<HomeSection>;
}

// Picks the right locale for a section text field, falling back to French
// (the seed default) when the desired locale is empty. Keeps the page from
// rendering blank if the admin only filled in one language.
export function pickText(
  text: LocalizedText | null | undefined,
  locale: Locale
): string {
  if (!text) return "";
  return text[locale]?.trim() || text.fr?.trim() || text.en?.trim() || "";
}

import { supabaseHomeContentRepo } from "./supabase/homeContent";
export const homeContentRepo: HomeContentRepository = supabaseHomeContentRepo;
