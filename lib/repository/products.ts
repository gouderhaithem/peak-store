/**
 * Products repository.
 *
 * This is the seam between UI and data. Today it wraps the in-file mock data;
 * tomorrow it can be implemented against Supabase without touching any
 * consumers.
 *
 * Migration plan when adding Supabase:
 *   1. Move the body of each function in `mockProductsRepo` to query the
 *      `products` table via the supabase-js client.
 *   2. Map snake_case DB rows → camelCase Product shape inside the repo.
 *   3. Add error handling: surface `RepositoryError` instead of throwing raw.
 *   4. Decide caching strategy (Next.js cache tags, SWR, or React Query) at
 *      the repo boundary, not inside components.
 *
 * UI components should `await` these functions; do not import from mockdata
 * directly once the repo is in use.
 */

import {
  featuredProducts,
  lifestyleSections,
  shopProducts,
  type LifestyleSection,
  type Product,
} from "@/lib/mockdata";
import {
  CLOTHING_SIZES,
  KIDS_CLOTHING_SIZES,
  KIDS_SHOE_SIZES,
  SHOE_SIZES,
} from "@/lib/products";

export interface ProductFilters {
  genders?: Product["gender"][];
  types?: Product["type"][];
  categories?: ("shoes" | "clothing" | "accessories")[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "featured" | "price-asc" | "price-desc" | "newest";
  limit?: number;
}

export interface CreateProductInput {
  name: string;
  type: Product["type"];
  gender: Product["gender"];
  price: number;
  originalPrice?: number;
  // Ordered list of image URLs. imageUrls[0] is the primary (used in card
  // listings); the full array is stored as the gallery for the PDP.
  imageUrls: string[];
  description?: string;
  isNew: boolean;
  isActive: boolean;
  // Headline stock figure. Temporary — see migration 0012. Will be
  // replaced by per-variant stock once the variants editor lands.
  stock: number;
}

// Same shape as create, except stock is no longer part of the update path
// — per-size stock is owned by the dedicated stock editor page. The form
// renders the headline figure read-only and omits it from the payload, so
// a save can never race-overwrite total_stock with a stale value while
// another tab is editing variants.
export type UpdateProductInput = Omit<CreateProductInput, "stock">;

// Admin-only listing. Unlike the public `list`, this sees inactive products
// (RLS lets admins past the `is_active` filter) and includes the real stock
// figure summed across `product_variants`.
export interface AdminListParams {
  page: number; // 1-based
  pageSize: number;
  query?: string; // searches name (case-insensitive substring)
}

export interface AdminProductRow {
  id: string;
  name: string;
  type: Product["type"];
  image: string;
  price: number;
  stock: number;
  isActive: boolean;
  isNew?: boolean;
}

export interface AdminListResult {
  rows: AdminProductRow[];
  total: number;
}

export interface ProductColor {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string | null;
  hex: string;
  hexSecondary: string | null;
}

// One row of the product_variants table, in UI shape (camelCase, no centimes).
// Stock is per (size × optional color). Products can stay size-only,
// color-only, or use size+color combinations.
export interface ProductVariant {
  id: string;
  productId: string;
  size: string | null;
  colorId: string | null;
  color: ProductColor | null;
  sku: string | null;
  stock: number;
  isActive: boolean;
}

// Input row for the stock editor.
//   - `id` present → update that variant's stock
//   - `id` absent  → insert a new variant
// Variants currently in the DB but missing from the input list are deleted.
export interface VariantInput {
  id?: string;
  size: string | null;
  colorId: string | null;
  stock: number;
}

export interface ProductsRepository {
  list(filters?: ProductFilters): Promise<Product[]>;
  search(query: string, limit?: number): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findManyByIds(ids: string[]): Promise<Product[]>;
  listFeatured(limit?: number): Promise<Product[]>;
  listRelated(productId: string, limit?: number): Promise<Product[]>;
  listLifestyle(): Promise<LifestyleSection[]>;
  getSizeOptions(
    type: Product["type"],
    gender?: Product["gender"]
  ): Promise<string[]>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product>;
  // Soft delete — sets `is_active = false`. Storage files and historical
  // order_items references are preserved per decision §5.
  softDelete(id: string): Promise<void>;
  // Bulk soft-delete. Returns the number of rows affected.
  softDeleteMany(ids: string[]): Promise<number>;
  // Bulk active/draft toggle. Returns the number of rows affected.
  setManyActive(ids: string[], isActive: boolean): Promise<number>;
  // Clones a product (row + variants + gallery) into a new product with a
  // fresh slug and an "(copy)" suffix on the name. Returns the new product.
  duplicate(id: string): Promise<Product>;
  listAdmin(params: AdminListParams): Promise<AdminListResult>;
  listLowStock(threshold?: number): Promise<AdminProductRow[]>;
  listColors(): Promise<ProductColor[]>;
  listVariants(productId: string): Promise<ProductVariant[]>;
  saveVariants(
    productId: string,
    variants: VariantInput[]
  ): Promise<ProductVariant[]>;
}

const CATEGORY_TYPES: Record<string, Product["type"][]> = {
  shoes: ["running", "basketball", "casual", "training"],
  clothing: ["apparel"],
  accessories: [],
};

function applyFilters(products: Product[], f: ProductFilters): Product[] {
  let out = products;
  if (f.genders?.length) {
    out = out.filter((p) => f.genders!.includes(p.gender));
  }
  if (f.types?.length) {
    out = out.filter((p) => f.types!.includes(p.type));
  }
  if (f.categories?.length) {
    out = out.filter((p) =>
      f.categories!.some((cat) => CATEGORY_TYPES[cat]?.includes(p.type))
    );
  }
  if (typeof f.minPrice === "number") {
    out = out.filter((p) => p.price >= f.minPrice!);
  }
  if (typeof f.maxPrice === "number") {
    out = out.filter((p) => p.price <= f.maxPrice!);
  }
  if (f.sortBy && f.sortBy !== "featured") {
    out = [...out].sort((a, b) => {
      if (f.sortBy === "price-asc") return a.price - b.price;
      if (f.sortBy === "price-desc") return b.price - a.price;
      if (f.sortBy === "newest") return a.id.localeCompare(b.id);
      return 0;
    });
  }
  if (typeof f.limit === "number") out = out.slice(0, f.limit);
  return out;
}

export const mockProductsRepo: ProductsRepository = {
  async list(filters = {}) {
    return applyFilters(shopProducts, filters);
  },
  async search(query, limit = 8) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results = [...shopProducts, ...featuredProducts]
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, limit);
    return results;
  },
  async findById(id) {
    return (
      shopProducts.find((p) => p.id === id) ??
      featuredProducts.find((p) => p.id === id) ??
      null
    );
  },
  async findManyByIds(ids) {
    if (ids.length === 0) return [];
    const set = new Set(ids);
    const pool = [...shopProducts, ...featuredProducts];
    const seen = new Set<string>();
    return pool.filter((p) => {
      if (!set.has(p.id) || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  },
  async listFeatured(limit) {
    const out = featuredProducts.slice();
    return typeof limit === "number" ? out.slice(0, limit) : out;
  },
  async listRelated(productId, limit = 4) {
    const product =
      shopProducts.find((p) => p.id === productId) ??
      featuredProducts.find((p) => p.id === productId);
    if (!product) return [];
    return shopProducts
      .filter((p) => p.id !== productId && p.type === product.type)
      .slice(0, limit);
  },
  async listLifestyle() {
    return lifestyleSections;
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
    // Mock impl is a no-op-but-typed: returns a synthesized product. Real
    // writes only land via the Supabase impl.
    return {
      id: `mock_${Date.now()}`,
      name: input.name,
      category: input.type,
      gender: input.gender,
      type: input.type,
      price: input.price,
      originalPrice: input.originalPrice,
      image: input.imageUrls[0] ?? "",
      isNew: input.isNew || undefined,
    };
  },
  async update(id, input) {
    return {
      id,
      name: input.name,
      category: input.type,
      gender: input.gender,
      type: input.type,
      price: input.price,
      originalPrice: input.originalPrice,
      image: input.imageUrls[0] ?? "",
      images: input.imageUrls,
      isNew: input.isNew || undefined,
    };
  },
  async listVariants() {
    return [];
  },
  async listColors() {
    return [];
  },
  async saveVariants() {
    return [];
  },
  async softDelete() {
    // no-op in the mock
  },
  async softDeleteMany(ids) {
    return ids.length;
  },
  async setManyActive(ids) {
    return ids.length;
  },
  async duplicate(id) {
    const source =
      shopProducts.find((p) => p.id === id) ??
      featuredProducts.find((p) => p.id === id);
    if (!source) throw new Error("Product not found");
    return { ...source, id: `mock_${Date.now()}`, name: `${source.name} (copy)` };
  },
  async listLowStock(threshold = 5) {
    return shopProducts.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      image: p.image,
      price: p.price,
      stock: Math.floor(Math.random() * threshold),
      isActive: true,
      isNew: p.isNew,
    }));
  },
  async listAdmin({ page, pageSize, query }) {
    const q = (query ?? "").trim().toLowerCase();
    const filtered = q
      ? shopProducts.filter((p) => p.name.toLowerCase().includes(q))
      : shopProducts;
    const start = Math.max(0, (page - 1) * pageSize);
    const rows = filtered.slice(start, start + pageSize).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      image: p.image,
      price: p.price,
      stock: 0,
      isActive: true,
      isNew: p.isNew,
    }));
    return { rows, total: filtered.length };
  },
};

import { supabaseProductsRepo } from "./supabase/products";

// Real impl. `mockProductsRepo` is still exported above for tests or for
// running the storefront offline; swap the binding below to use it.
export const productsRepo: ProductsRepository = supabaseProductsRepo;
