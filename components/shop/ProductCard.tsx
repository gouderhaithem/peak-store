"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Product, formatPrice } from "@/lib/mockdata";
import { getSizeOptions } from "@/lib/products";
import { useFavorites } from "@/lib/useFavorites";
import { useCart, openCartDrawer } from "@/lib/useCart";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { isFavorite, toggle, hydrated } = useFavorites();
  const { add } = useCart();
  const t = useTranslations();
  const toast = useToast();
  const favorited = hydrated && isFavorite(product.id);
  const href = `/shop/${product.id}`;
  const hasSizes = getSizeOptions(product.type, product.gender).length > 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (hasSizes) {
      router.push(href);
      return;
    }
    add(product.id, null, 1);
    toast.success(
      t("toast.addedToCart"),
      t("toast.addedToCartDesc", { name: product.name })
    );
    openCartDrawer();
  }

  function handleFavorite() {
    const wasFavorited = favorited;
    toggle(product.id);
    if (wasFavorited) {
      toast.info(t("toast.removedFromFavorites"), product.name);
    } else {
      toast.success(t("toast.addedToFavorites"), product.name);
    }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E5E5] hover:border-[#D4D4D4] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-300 relative group">
      {/* Sale Badge */}
      {product.discount && (
        <span className="absolute top-3 right-3 bg-[#DC2626] text-white w-[50px] h-[50px] rounded-full flex items-center justify-center font-bold text-[13px] z-10 shadow-[0_2px_8px_rgba(220,38,38,0.4)]">
          -{product.discount}%
        </span>
      )}

      {/* Favorite Button */}
      <button
        type="button"
        aria-label={
          favorited
            ? t("product.removeFromFavorites")
            : t("product.addToFavorites")
        }
        aria-pressed={favorited}
        onClick={handleFavorite}
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

      {/* Product Image (links to detail page) */}
      <Link href={href} className="block">
        <div className="aspect-square bg-[#F5F5F5] relative overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
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
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#737373] mb-2">
          {product.category}
        </p>
        <Link href={href} className="block group/title">
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-3 group-hover/title:text-[#DC2626] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mb-4">
          {product.originalPrice && (
            <span className="inline-block text-[#A3A3A3] line-through text-base font-medium mr-2">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className="text-xl font-bold text-[#DC2626]">
            {formatPrice(product.price)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="w-full bg-[#0A0A0A] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#262626] transition-colors duration-200"
        >
          {t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}
