"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { formatPrice, type Product } from "@/lib/mockdata";
import { productsRepo } from "@/lib/repository";
import { useFavorites } from "@/lib/useFavorites";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function NewArrivals() {
  const { isFavorite, toggle, hydrated } = useFavorites();
  const t = useTranslations();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    productsRepo.listFeatured().then((rows) => {
      if (!cancelled) setProducts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggleFavorite(productId: string, productName: string) {
    const wasFavorited = hydrated && isFavorite(productId);
    toggle(productId);
    if (wasFavorited) {
      toast.info(t("toast.removedFromFavorites"), productName);
    } else {
      toast.success(t("toast.addedToFavorites"), productName);
    }
  }

  return (
    <section className="bg-[#FAFAFA] py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-[#0A0A0A]">
            {t("home.newArrivalsTitle")}
          </h2>
          <p className="text-lg text-[#525252]">{t("home.newArrivalsSubtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product) => {
            const favorited = hydrated && isFavorite(product.id);
            const href = `/shop/${product.id}`;
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#E5E5E5] hover:border-[#D4D4D4] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-300 group relative cursor-pointer"
              >
                {/* Favorite Button */}
                <button
                  type="button"
                  aria-label={
                    favorited
                      ? t("product.removeFromFavorites")
                      : t("product.addToFavorites")
                  }
                  aria-pressed={favorited}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleFavorite(product.id, product.name);
                  }}
                  className={cn(
                    "absolute top-3 left-3 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:scale-110 active:scale-95 transition-all duration-200",
                    favorited ? "text-[#DC2626]" : "text-[#404040] hover:text-[#DC2626]"
                  )}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={favorited ? "currentColor" : "none"}
                    strokeWidth={2}
                  />
                </button>

                {/* Product Image */}
                <Link href={href} className="block">
                  <div className="aspect-square bg-[#F5F5F5] relative overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#A3A3A3] text-sm">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2 text-[#D4D4D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{t("home.photoPlaceholder")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <Link href={href} className="block p-5 group/info">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#737373] mb-2">
                    {product.category}
                  </p>
                  <h3 className="text-lg font-semibold text-[#0A0A0A] mb-3 group-hover/info:text-[#DC2626] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xl font-bold text-[#DC2626]">
                    {formatPrice(product.price)}
                  </p>
                </Link>
              </div>
            );
          })}
        </div>

        {/* View More */}
        <div className="mt-12 text-center">
          <Link
            href="/shop?sort=newest"
            className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white px-8 py-4 rounded-lg font-semibold text-sm hover:bg-[#262626] transition-colors duration-200"
          >
            {t("common.viewMore")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
