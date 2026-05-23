"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FiltersSidebar, {
  type FiltersState,
  emptyFilters,
} from "@/components/shop/FiltersSidebar";
import ProductCard from "@/components/shop/ProductCard";
import FeaturesSection from "@/components/home/FeaturesSection";
import type { Product } from "@/lib/mockdata";
import { productsRepo } from "@/lib/repository";
import { useTranslations } from "@/lib/i18n";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function filtersFromParams(params: URLSearchParams): FiltersState {
  const get = (k: string) =>
    params.get(k)?.split(",").filter(Boolean) ?? [];
  const min = Number(params.get("minPrice")) || 0;
  const max = Number(params.get("maxPrice")) || 25000;
  return {
    categories: get("categories"),
    genders: get("gender"),
    types: get("type"),
    sizes: get("size"),
    priceRange: [min, max],
  };
}

function filtersToQuery(f: FiltersState): string {
  const params = new URLSearchParams();
  if (f.categories.length) params.set("categories", f.categories.join(","));
  if (f.genders.length) params.set("gender", f.genders.join(","));
  if (f.types.length) params.set("type", f.types.join(","));
  if (f.sizes.length) params.set("size", f.sizes.join(","));
  if (f.priceRange[0] > 0) params.set("minPrice", String(f.priceRange[0]));
  if (f.priceRange[1] < 25000) params.set("maxPrice", String(f.priceRange[1]));
  return params.toString();
}

function ShopPageInner() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortValue, setSortValue] = useState<
    "featured" | "price-asc" | "price-desc" | "newest"
  >("featured");
  const [filters, setFilters] = useState<FiltersState>(emptyFilters);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate filters and sort from URL on mount and when query changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const next = filtersFromParams(params);
    setFilters(next);
    const sortParam = params.get("sort");
    if (
      sortParam === "featured" ||
      sortParam === "price-asc" ||
      sortParam === "price-desc" ||
      sortParam === "newest"
    ) {
      setSortValue(sortParam);
    }
  }, [searchParams]);

  // Load products from repository (mock today, Supabase tomorrow)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productsRepo.list().then((products) => {
      if (!cancelled) {
        setAllProducts(products);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateFilters(next: FiltersState) {
    setFilters(next);
    const qs = filtersToQuery(next);
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }

  const sortedProducts = useMemo(() => {
    const filtered = allProducts.filter((p) => {
      if (filters.genders.length && !filters.genders.includes(p.gender)) {
        return false;
      }
      if (filters.types.length && !filters.types.includes(p.type)) {
        return false;
      }
      if (filters.categories.length) {
        // Same category mapping the repo uses; mirrored here for client-side filtering
        const matchers: Record<string, Product["type"][]> = {
          shoes: ["running", "basketball", "casual", "training"],
          clothing: ["apparel"],
          accessories: [],
        };
        const matchesAny = filters.categories.some((catId) =>
          (matchers[catId] ?? []).includes(p.type)
        );
        if (!matchesAny) return false;
      }
      if (
        p.price < filters.priceRange[0] ||
        p.price > filters.priceRange[1]
      ) {
        return false;
      }
      return true;
    });
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortValue === "price-asc") return a.price - b.price;
      if (sortValue === "price-desc") return b.price - a.price;
      if (sortValue === "newest") return a.id.localeCompare(b.id);
      return 0;
    });
    return arr;
  }, [allProducts, filters, sortValue]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-6 py-10 pb-20">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-[#0A0A0A] mb-3">
              {t("shop.title")}
            </h1>
            <p className="text-[#525252]">{t("shop.subtitle")}</p>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 w-full bg-[#0A0A0A] text-white py-3.5 rounded-lg font-semibold mb-6 hover:bg-[#262626] transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {t("shop.filters")}
          </button>

          <div className="flex gap-10">
            {/* Sidebar */}
            <div className="w-[280px] shrink-0 hidden lg:block">
              <FiltersSidebar
                filters={filters}
                onChange={updateFilters}
                isMobileOpen={mobileFiltersOpen}
                onClose={() => setMobileFiltersOpen(false)}
              />
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden">
              <FiltersSidebar
                filters={filters}
                onChange={updateFilters}
                isMobileOpen={mobileFiltersOpen}
                onClose={() => setMobileFiltersOpen(false)}
              />
            </div>

            {/* Products Area */}
            <div className="flex-1 min-w-0">
              {/* Products Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E5E5E5]">
                <p className="text-sm text-[#525252]">
                  {t("shop.showing")}{" "}
                  <strong className="text-[#0A0A0A]">
                    {sortedProducts.length} {t("shop.products")}
                  </strong>
                </p>
                <Select
                  value={sortValue}
                  onValueChange={(v) => {
                    if (v === "featured" || v === "price-asc" || v === "price-desc" || v === "newest") {
                      setSortValue(v);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] border-[#D4D4D4] text-[#404040]">
                    <SelectValue placeholder={t("shop.sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">{t("shop.sortFeatured")}</SelectItem>
                    <SelectItem value="price-asc">{t("shop.sortPriceAsc")}</SelectItem>
                    <SelectItem value="price-desc">{t("shop.sortPriceDesc")}</SelectItem>
                    <SelectItem value="newest">{t("shop.sortNewest")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden"
                    >
                      <div className="aspect-square bg-[#F5F5F5] animate-pulse" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 w-20 bg-[#F5F5F5] rounded animate-pulse" />
                        <div className="h-5 w-3/4 bg-[#F5F5F5] rounded animate-pulse" />
                        <div className="h-6 w-24 bg-[#F5F5F5] rounded animate-pulse" />
                        <div className="h-11 w-full bg-[#F5F5F5] rounded-lg animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5]">
                  <p className="text-[#525252] mb-4">{t("shop.noResults")}</p>
                  <button
                    onClick={() => updateFilters(emptyFilters)}
                    className="h-10 px-5 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    {t("filters.clearAll")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <FeaturesSection />
      </main>
      <Footer />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageInner />
    </Suspense>
  );
}
