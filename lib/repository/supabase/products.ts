/**
 * Supabase implementation of ProductsRepository.
 *
 * Reads from the `products` table. The publishable key sees only
 * `is_active = true` rows (enforced by RLS); admins see everything when
 * they call this from a session-authenticated server context.
 *
 * The DB stores money as integer centimes and images as relative bucket
 * paths. This file is the only place that maps those to the UI shape
 * (DZD integer + absolute URL).
 */

import { getPublicClient } from "@/lib/supabase/public";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type { CompactProduct, Product } from "@/lib/mockdata";
import { lifestyleSections } from "@/lib/mockdata";
import {
  CLOTHING_SIZES,
  KIDS_CLOTHING_SIZES,
  KIDS_SHOE_SIZES,
  SHOE_SIZES,
  getSizeOptions,
} from "@/lib/products";
import type {
  AdminListParams,
  AdminListResult,
  AdminProductRow,
  ProductColor,
  ProductsRepository,
  ProductVariant,
  UpdateProductInput,
} from "@/lib/repository/products";

interface ProductRow {
  id: string;
  name: string;
  category: "shoes" | "clothing" | "accessories";
  gender: Product["gender"];
  type: Product["type"];
  price_cents: number;
  original_price_cents: number | null;
  discount_pct: number | null;
  image_path: string;
  is_new: boolean;
  created_at: string;
}

interface ProductDetailRow extends ProductRow {
  description: string | null;
  is_active: boolean;
  total_stock: number;
}

const PRODUCT_COLUMNS =
  "id,name,category,gender,type,price_cents,original_price_cents,discount_pct,image_path,is_new,created_at";

const PRODUCT_DETAIL_COLUMNS = `${PRODUCT_COLUMNS},description,is_active,total_stock`;

// Display label for the UI's `category` string. The schema's `category`
// column is the top-level catalog bucket (shoes/clothing/accessories), but
// the storefront cards have always shown a more specific label derived
// from `type`. Keeping that here so the admin can pick the type enum and
// the storefront gets the friendlier word for free.
const TYPE_LABEL: Record<Product["type"], string> = {
  running: "Running",
  basketball: "Basketball",
  casual: "Lifestyle",
  training: "Training",
  apparel: "Apparel",
};

function buildImageUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/product-images/${path}`;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: TYPE_LABEL[row.type] ?? row.type,
    gender: row.gender,
    type: row.type,
    price: Math.round(row.price_cents / 100),
    originalPrice:
      row.original_price_cents !== null
        ? Math.round(row.original_price_cents / 100)
        : undefined,
    discount: row.discount_pct ?? undefined,
    image: buildImageUrl(row.image_path),
    isNew: row.is_new || undefined,
  };
}

function mapCompactRow(row: ProductRow): CompactProduct {
  return {
    id: row.id,
    name: row.name,
    price: Math.round(row.price_cents / 100),
    originalPrice:
      row.original_price_cents !== null
        ? Math.round(row.original_price_cents / 100)
        : undefined,
    image: buildImageUrl(row.image_path),
  };
}

async function listLifestyleProducts(
  supabase: ReturnType<typeof getPublicClient>,
  sectionId: string
): Promise<CompactProduct[]> {
  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(4);

  switch (sectionId) {
    case "apparel":
      query = query.eq("type", "apparel").neq("gender", "kids");
      break;
    case "performance":
      query = query.in("type", ["running", "basketball", "training"]).neq(
        "gender",
        "kids"
      );
      break;
    case "kids":
      query = query.eq("gender", "kids");
      break;
    case "promotion":
      query = query.not("original_price_cents", "is", null);
      break;
    default:
      break;
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapCompactRow(row as ProductRow));
}

const CATEGORY_TYPES: Record<"shoes" | "clothing" | "accessories", Product["type"][]> = {
  shoes: ["running", "basketball", "casual", "training"],
  clothing: ["apparel"],
  accessories: [],
};

export const supabaseProductsRepo: ProductsRepository = {
  async list(filters = {}) {
    const supabase = getPublicClient();
    let q = supabase.from("products").select(PRODUCT_COLUMNS);

    if (filters.genders?.length) {
      q = q.in("gender", filters.genders);
    }

    if (filters.categories?.length) {
      // Filter by the DB `category` column (shoes / clothing / accessories).
      // Empty buckets (e.g. accessories with no mapped types yet) still
      // work — they just return zero rows.
      q = q.in("category", filters.categories);
    }

    if (filters.types?.length) {
      q = q.in("type", filters.types);
    }

    if (typeof filters.minPrice === "number") {
      q = q.gte("price_cents", filters.minPrice * 100);
    }
    if (typeof filters.maxPrice === "number") {
      q = q.lte("price_cents", filters.maxPrice * 100);
    }

    switch (filters.sortBy) {
      case "price-asc":
        q = q.order("price_cents", { ascending: true });
        break;
      case "price-desc":
        q = q.order("price_cents", { ascending: false });
        break;
      case "newest":
      case "featured":
      default:
        q = q.order("created_at", { ascending: false });
    }

    if (typeof filters.limit === "number") {
      q = q.limit(filters.limit);
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row as ProductRow));
  },

  async findById(id) {
    // Detail reads go through the auth'd browser client so admins can
    // load inactive products to edit. The public RLS policy still hides
    // inactive rows from non-admins, so anonymous callers get null.
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_DETAIL_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const detail = data as ProductDetailRow;
    const base = mapRow(detail);

    // Load the full gallery so the edit form can pre-populate every image,
    // not just the primary on `products.image_path`.
    const { data: gallery } = await supabase
      .from("product_images")
      .select("path, position")
      .eq("product_id", id)
      .order("position", { ascending: true });

    const images = (gallery ?? []).map((row) =>
      /^https?:\/\//.test(row.path) ? row.path : buildImageUrl(row.path),
    );

    return {
      ...base,
      images: images.length > 0 ? images : [base.image],
      description: detail.description ?? undefined,
      isActive: detail.is_active,
      stock: detail.total_stock,
    };
  },

  async findManyByIds(ids) {
    if (ids.length === 0) return [];
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .in("id", ids);
    if (error) throw error;
    const byId = new Map<string, Product>(
      (data ?? []).map((row) => {
        const product = mapRow(row as ProductRow);
        return [product.id, product];
      }),
    );
    // Preserve the caller's id order; drop ids that returned nothing.
    return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  },

  async listFeatured(limit) {
    const supabase = getPublicClient();
    // "Featured" = anything marked new, or anything from the last 30 days.
    // No editorial flag — see decision §1 in docs/supabase-schema.md.
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    let q = supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .or(`is_new.eq.true,created_at.gt.${thirtyDaysAgo}`)
      .order("created_at", { ascending: false });
    if (typeof limit === "number") q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row as ProductRow));
  },

  async listRelated(productId, limit = 4) {
    const supabase = getPublicClient();
    // Same `type` as the source product, excluding the source itself.
    const { data: source, error: srcErr } = await supabase
      .from("products")
      .select("type")
      .eq("id", productId)
      .maybeSingle();
    if (srcErr) throw srcErr;
    if (!source) return [];
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("type", source.type)
      .neq("id", productId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => mapRow(row as ProductRow));
  },

  async listLifestyle() {
    const supabase = getPublicClient();
    const sections = await Promise.all(
      lifestyleSections.map(async (section) => ({
        ...section,
        products: await listLifestyleProducts(supabase, section.id),
      }))
    );
    return sections;
  },

  async getSizeOptions(type, gender) {
    if (type === "apparel") {
      return gender === "kids" ? KIDS_CLOTHING_SIZES : CLOTHING_SIZES;
    }
    if (
      type === "running" ||
      type === "basketball" ||
      type === "casual" ||
      type === "training"
    ) {
      return gender === "kids" ? KIDS_SHOE_SIZES : SHOE_SIZES;
    }
    return [];
  },

  async create(input) {
    // Writes go through the browser client so they carry the admin's
    // auth cookies. The `products_write_admin` RLS policy on the table
    // is the real authorization check — if the caller isn't an admin,
    // Postgres rejects the insert with a "row-level security" error.
    const supabase = createBrowserSupabase();

    if (input.imageUrls.length === 0) {
      throw new Error("At least one image is required");
    }

    const slug = `${slugify(input.name) || "product"}-${randomSuffix()}`;
    const category = deriveCategory(input.type);
    const primary = input.imageUrls[0].trim();

    const row = {
      slug,
      name: input.name.trim(),
      category,
      gender: input.gender,
      type: input.type,
      price_cents: Math.round(input.price * 100),
      original_price_cents:
        typeof input.originalPrice === "number" && input.originalPrice > 0
          ? Math.round(input.originalPrice * 100)
          : null,
      image_path: primary,
      description: input.description?.trim() || null,
      is_new: input.isNew,
      is_active: input.isActive,
      total_stock: Math.max(0, Math.floor(input.stock ?? 0)),
    };

    const { data, error } = await supabase
      .from("products")
      .insert(row)
      .select(PRODUCT_COLUMNS)
      .single();

    if (error) throw error;

    // Persist the full gallery to product_images so the PDP can render
    // all uploaded photos. We store every URL (including the primary at
    // position 0) — the storefront treats this table as the canonical
    // gallery and `products.image_path` as a fast-path for lists.
    const galleryRows = input.imageUrls.map((url, position) => ({
      product_id: data.id,
      path: url.trim(),
      position,
    }));

    const { error: imgErr } = await supabase
      .from("product_images")
      .insert(galleryRows);

    if (imgErr) {
      // The product is already in the DB but the gallery insert failed.
      // Roll back so the admin doesn't end up with a half-saved product
      // they can't see in the gallery.
      await supabase.from("products").delete().eq("id", data.id);
      throw imgErr;
    }

    // Seed one variant per applicable size, each with the headline stock
    // figure copied from the form. The admin can fine-tune per-size stock
    // later from the dedicated Manage stock page. Products with no size
    // axis (future accessories) skip this and keep total_stock as-written.
    const seedSizes = getSizeOptions(input.type, input.gender);
    const perSizeStock = Math.max(0, Math.floor(input.stock ?? 0));
    if (seedSizes.length > 0) {
      const variantRows = seedSizes.map((size) => ({
        product_id: data.id,
        size,
        color_id: null,
        stock: perSizeStock,
      }));
      const { error: varErr } = await supabase
        .from("product_variants")
        .insert(variantRows);
      if (varErr) {
        // Same rollback policy as the gallery — keep the catalog clean.
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", data.id);
        await supabase.from("products").delete().eq("id", data.id);
        throw varErr;
      }
      // Migration 0013's trigger has already overwritten total_stock to
      // the sum across variants. Re-fetch so the returned object reflects
      // that, instead of the stale value from the original insert.
      const { data: refreshed } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("id", data.id)
        .single();
      if (refreshed) return mapRow(refreshed as ProductRow);
    }

    return mapRow(data as ProductRow);
  },

  async listAdmin({
    page,
    pageSize,
    query,
  }: AdminListParams): Promise<AdminListResult> {
    // Admin reads go through the auth'd browser client so RLS lets us
    // see inactive products too.
    const supabase = createBrowserSupabase();

    const from = Math.max(0, (page - 1) * pageSize);
    const to = from + pageSize - 1;

    let q = supabase
      .from("products")
      .select(`${PRODUCT_COLUMNS},is_active,total_stock`, {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    const trimmed = (query ?? "").trim();
    if (trimmed) {
      // Escape LIKE wildcards so a literal "%" or "_" in the search box
      // doesn't accidentally match everything.
      const escaped = trimmed.replace(/[%_]/g, "\\$&");
      q = q.ilike("name", `%${escaped}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;

    const rows: AdminProductRow[] = (data ?? []).map((row) => {
      const r = row as ProductRow & {
        is_active: boolean;
        total_stock: number;
      };
      const mapped = mapRow(r);
      return {
        id: mapped.id,
        name: mapped.name,
        type: mapped.type,
        image: mapped.image,
        price: mapped.price,
        stock: r.total_stock ?? 0,
        isActive: r.is_active,
        isNew: mapped.isNew,
      };
    });

    return { rows, total: count ?? rows.length };
  },

  async listColors() {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("colors")
      .select("id,slug,name_fr,name_ar,hex,hex_secondary")
      .eq("is_active", true)
      .order("name_fr", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => mapColorRow(row as ColorRow));
  },

  async update(id, input: UpdateProductInput) {
    const supabase = createBrowserSupabase();

    if (input.imageUrls.length === 0) {
      throw new Error("At least one image is required");
    }

    // 1. Snapshot the existing gallery so we can compute which storage
    //    objects are orphaned after the save.
    const { data: oldGallery } = await supabase
      .from("product_images")
      .select("path")
      .eq("product_id", id);

    // 2. Update the products row. Slug stays the same — changing it would
    //    break any in-flight links to the PDP.
    const category = deriveCategory(input.type);
    const primary = input.imageUrls[0].trim();

    // total_stock is intentionally NOT updated here. Per-size stock is
    // managed by the stock editor page; the trigger in migration 0013
    // keeps total_stock in sync with the sum of variants.
    const { data, error } = await supabase
      .from("products")
      .update({
        name: input.name.trim(),
        category,
        gender: input.gender,
        type: input.type,
        price_cents: Math.round(input.price * 100),
        original_price_cents:
          typeof input.originalPrice === "number" && input.originalPrice > 0
            ? Math.round(input.originalPrice * 100)
            : null,
        image_path: primary,
        description: input.description?.trim() || null,
        is_new: input.isNew,
        is_active: input.isActive,
      })
      .eq("id", id)
      .select(PRODUCT_COLUMNS)
      .single();

    if (error) throw error;

    // 3. Replace the gallery rows. Wipe-and-reinsert is the simplest
    //    semantic — the form treats `images` as the full desired state.
    const { error: delErr } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);
    if (delErr) throw delErr;

    const newRows = input.imageUrls.map((url, position) => ({
      product_id: id,
      path: url.trim(),
      position,
    }));
    const { error: insErr } = await supabase
      .from("product_images")
      .insert(newRows);
    if (insErr) throw insErr;

    // 4. Best-effort storage cleanup: anything that was in the old gallery
    //    and isn't in the new one is now orphaned in the bucket.
    const keptPaths = new Set(
      input.imageUrls
        .map(extractStoragePath)
        .filter((p): p is string => p !== null),
    );
    const orphans: string[] = [];
    for (const row of oldGallery ?? []) {
      const p = extractStoragePath(row.path);
      if (p && !keptPaths.has(p)) orphans.push(p);
    }
    if (orphans.length > 0) {
      await supabase.storage.from("product-images").remove(orphans);
    }

    return mapRow(data as ProductRow);
  },

  async softDelete(id) {
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);
    if (error) throw error;
  },

  async softDeleteMany(ids) {
    if (ids.length === 0) return 0;
    const supabase = createBrowserSupabase();
    const { error, count } = await supabase
      .from("products")
      .update({ is_active: false })
      .in("id", ids);
    if (error) throw error;
    return count ?? ids.length;
  },

  async setManyActive(ids, isActive) {
    if (ids.length === 0) return 0;
    const supabase = createBrowserSupabase();
    const { error, count } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .in("id", ids);
    if (error) throw error;
    return count ?? ids.length;
  },

  async duplicate(id) {
    const supabase = createBrowserSupabase();

    // 1. Snapshot the full source: row, gallery, variants. Doing this in
    //    three reads (not a server-side function) keeps the impl in TS and
    //    inside the same RLS context as the rest of the admin actions.
    const { data: srcRow, error: srcErr } = await supabase
      .from("products")
      .select(
        `${PRODUCT_DETAIL_COLUMNS},price_cents,original_price_cents,slug`
      )
      .eq("id", id)
      .single();
    if (srcErr) throw srcErr;
    if (!srcRow) throw new Error("Product not found");

    const { data: srcImages, error: imgReadErr } = await supabase
      .from("product_images")
      .select("path,position")
      .eq("product_id", id)
      .order("position", { ascending: true });
    if (imgReadErr) throw imgReadErr;

    const { data: srcVariants, error: varReadErr } = await supabase
      .from("product_variants")
      .select("size,color_id,stock")
      .eq("product_id", id);
    if (varReadErr) throw varReadErr;

    // 2. Insert the duplicate product row with a fresh slug. We point at
    //    the same storage paths instead of duplicating the files — the
    //    bucket is public-read, so sharing paths is safe. If the admin
    //    later replaces the gallery on the copy, those new uploads land
    //    in fresh paths via the existing form flow.
    const src = srcRow as ProductDetailRow & {
      slug: string;
      price_cents: number;
      original_price_cents: number | null;
    };
    const newSlug = `${src.slug}-copy-${randomSuffix()}`;
    const { data: newRow, error: insErr } = await supabase
      .from("products")
      .insert({
        slug: newSlug,
        name: `${src.name} (copy)`,
        category: src.category,
        gender: src.gender,
        type: src.type,
        price_cents: src.price_cents,
        original_price_cents: src.original_price_cents,
        image_path: src.image_path,
        description: src.description,
        is_new: src.is_new,
        // Duplicates land as drafts — the admin reviews and flips to
        // active when they're ready. Avoids accidentally publishing a
        // half-edited copy.
        is_active: false,
        total_stock: 0,
      })
      .select(PRODUCT_COLUMNS)
      .single();
    if (insErr) throw insErr;
    const newId = newRow.id as string;

    // 3. Copy gallery rows.
    if (srcImages && srcImages.length > 0) {
      const gallery = srcImages.map((r) => ({
        product_id: newId,
        path: r.path as string,
        position: r.position as number,
      }));
      const { error: insImgErr } = await supabase
        .from("product_images")
        .insert(gallery);
      if (insImgErr) {
        await supabase.from("products").delete().eq("id", newId);
        throw insImgErr;
      }
    }

    // 4. Copy variants. Stock carries over from the source so the duplicate
    //    starts inventoried; admin can adjust on the stock page.
    if (srcVariants && srcVariants.length > 0) {
      const variants = srcVariants.map((v) => ({
        product_id: newId,
        size: v.size as string | null,
        color_id: v.color_id as string | null,
        stock: v.stock as number,
      }));
      const { error: insVarErr } = await supabase
        .from("product_variants")
        .insert(variants);
      if (insVarErr) {
        await supabase
          .from("product_images")
          .delete()
          .eq("product_id", newId);
        await supabase.from("products").delete().eq("id", newId);
        throw insVarErr;
      }
    }

    return mapRow(newRow as ProductRow);
  },

  async listVariants(productId) {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase
      .from("product_variants")
      .select(
        "id,product_id,size,color_id,sku,stock,is_active,colors(id,slug,name_fr,name_ar,hex,hex_secondary)"
      )
      .eq("product_id", productId)
      .order("size", { ascending: true })
      .order("color_id", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapVariantRow);
  },

  async saveVariants(productId, variants) {
    const supabase = createBrowserSupabase();

    // 1. Snapshot the current set so we know what to delete.
    const { data: existing, error: readErr } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);
    if (readErr) throw readErr;

    const keptIds = new Set(
      variants.filter((v) => v.id).map((v) => v.id as string)
    );
    const toDelete = (existing ?? [])
      .map((r) => r.id as string)
      .filter((id) => !keptIds.has(id));

    // 2. Delete dropped variants. Order_items.variant_id is `on delete set
    //    null`, so historical orders keep their snapshot data.
    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("product_variants")
        .delete()
        .in("id", toDelete);
      if (delErr) throw delErr;
    }

    // 3. Update existing rows. Doing this one-by-one is fine for the
    //    handful of sizes a product carries.
    for (const v of variants) {
      if (!v.id) continue;
      const { error: upErr } = await supabase
        .from("product_variants")
        .update({
          size: v.size,
          color_id: v.colorId,
          stock: Math.max(0, Math.floor(v.stock)),
        })
        .eq("id", v.id);
      if (upErr) throw upErr;
    }

    // 4. Insert brand-new rows.
    const inserts = variants
      .filter((v) => !v.id)
      .map((v) => ({
        product_id: productId,
        size: v.size,
        color_id: v.colorId,
        stock: Math.max(0, Math.floor(v.stock)),
      }));
    if (inserts.length > 0) {
      const { error: insErr } = await supabase
        .from("product_variants")
        .insert(inserts);
      if (insErr) throw insErr;
    }

    // 5. Re-read the canonical state to return. The trigger added in
    //    migration 0013 has already updated products.total_stock by now.
    const { data: refreshed, error: refErr } = await supabase
      .from("product_variants")
      .select(
        "id,product_id,size,color_id,sku,stock,is_active,colors(id,slug,name_fr,name_ar,hex,hex_secondary)"
      )
      .eq("product_id", productId)
      .order("size", { ascending: true })
      .order("color_id", { ascending: true });
    if (refErr) throw refErr;

    return (refreshed ?? []).map(mapVariantRow);
  },
};

interface VariantRow {
  id: string;
  product_id: string;
  size: string | null;
  color_id: string | null;
  sku: string | null;
  stock: number;
  is_active: boolean;
  colors?: ColorRow | ColorRow[] | null;
}

interface ColorRow {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string | null;
  hex: string;
  hex_secondary: string | null;
}

function mapColorRow(row: ColorRow): ProductColor {
  return {
    id: row.id,
    slug: row.slug,
    nameFr: row.name_fr,
    nameAr: row.name_ar,
    hex: row.hex,
    hexSecondary: row.hex_secondary,
  };
}

function mapVariantRow(row: VariantRow): ProductVariant {
  const colorRow = Array.isArray(row.colors) ? row.colors[0] : row.colors;
  return {
    id: row.id,
    productId: row.product_id,
    size: row.size,
    colorId: row.color_id,
    color: colorRow ? mapColorRow(colorRow) : null,
    sku: row.sku,
    stock: row.stock,
    isActive: row.is_active,
  };
}

// Pulls the bucket-relative path out of a public storage URL so we can
// hand it to `storage.remove([...])`. Returns null for URLs that don't
// look like our `product-images` bucket (e.g. legacy Unsplash links) —
// those get left alone.
function extractStoragePath(url: string): string | null {
  const m = url.match(
    /\/storage\/v1\/object\/public\/product-images\/([^?]+)/,
  );
  return m ? m[1] : null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

// The DB `category` column is one of shoes / clothing / accessories.
// We derive it from the more-granular `type` enum the form already
// exposes. If we add an accessories-typed product later, extend this.
function deriveCategory(
  type: Product["type"],
): "shoes" | "clothing" | "accessories" {
  if (type === "apparel") return "clothing";
  return "shoes";
}


// re-export so consumers can pick the impl in one place
export { CATEGORY_TYPES };
