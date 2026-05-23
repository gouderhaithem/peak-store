"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  Heart,
  Maximize2,
  CheckCircle2,
  Shield,
  Truck,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/shop/ProductCard";
import OrderFormSheet from "@/components/shop/OrderFormSheet";
import { formatPrice, type Product } from "@/lib/mockdata";
import { productsRepo } from "@/lib/repository";
import type { ProductColor, ProductVariant } from "@/lib/repository/products";
import { getSizeKind, getSizeOptions } from "@/lib/products";
import { useFavorites } from "@/lib/useFavorites";
import { useCart, openCartDrawer } from "@/lib/useCart";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      productsRepo.findById(id),
      productsRepo.listRelated(id, 4),
      productsRepo.listVariants(id).catch(() => [] as ProductVariant[]),
    ]).then(([found, rel, vars]) => {
      if (cancelled) return;
      setProduct(found);
      setRelated(rel);
      setVariants(vars);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (product === undefined) {
    return <LoadingView />;
  }
  if (product === null) {
    return <NotFoundView />;
  }

  return <ProductView product={product} related={related} variants={variants} />;
}

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={cn("bg-[#F5F5F5] rounded-lg animate-pulse", className)} />
  );
}

function LoadingView() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-8">
            <SkeletonBox className="h-4 w-12" />
            <SkeletonBox className="h-4 w-2" />
            <SkeletonBox className="h-4 w-12" />
            <SkeletonBox className="h-4 w-2" />
            <SkeletonBox className="h-4 w-40" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16">
            {/* Gallery skeleton */}
            <div className="flex gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-3 shrink-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBox key={i} className="w-20 h-20 rounded-xl" />
                ))}
              </div>
              {/* Main image */}
              <SkeletonBox className="flex-1 aspect-square rounded-2xl" />
            </div>

            {/* Info skeleton */}
            <div className="space-y-5">
              {/* Nav arrows */}
              <div className="flex items-center gap-1">
                <SkeletonBox className="w-8 h-8 rounded-full" />
                <SkeletonBox className="w-8 h-8 rounded-full" />
                <SkeletonBox className="w-8 h-8 rounded-full" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <SkeletonBox className="h-10 w-3/4" />
                <SkeletonBox className="h-10 w-1/2" />
              </div>

              {/* Price */}
              <SkeletonBox className="h-9 w-32" />

              {/* Size label */}
              <SkeletonBox className="h-4 w-24" />

              {/* Size buttons */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonBox key={i} className="h-11 w-14 rounded-lg" />
                ))}
              </div>

              {/* Stock indicator */}
              <SkeletonBox className="h-4 w-28" />

              {/* Quantity + buttons */}
              <div className="flex flex-wrap gap-3">
                <SkeletonBox className="h-12 w-32 rounded-lg" />
                <SkeletonBox className="h-12 flex-1 min-w-[180px] rounded-lg" />
                <SkeletonBox className="h-12 flex-1 min-w-[180px] rounded-lg" />
              </div>

              {/* Wishlist link */}
              <SkeletonBox className="h-4 w-36" />

              {/* Meta */}
              <div className="pt-4 border-t border-[#E5E5E5] space-y-2">
                <SkeletonBox className="h-4 w-48" />
                <SkeletonBox className="h-4 w-40" />
              </div>

              {/* Trust strip */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBox key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="mt-20 pt-10 border-t border-[#E5E5E5] space-y-3">
            <SkeletonBox className="h-8 w-48" />
            <SkeletonBox className="h-4 w-full max-w-2xl" />
            <SkeletonBox className="h-4 w-5/6 max-w-2xl" />
            <SkeletonBox className="h-4 w-4/6 max-w-2xl" />
          </div>

          {/* Related skeleton */}
          <div className="mt-20 space-y-6">
            <SkeletonBox className="h-8 w-56" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <SkeletonBox className="aspect-square rounded-2xl" />
                  <SkeletonBox className="h-3 w-16" />
                  <SkeletonBox className="h-5 w-3/4" />
                  <SkeletonBox className="h-6 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function NotFoundView() {
  const t = useTranslations();
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-32 px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl font-bold text-[#0A0A0A] mb-4">
            {t("product.productNotFound")}
          </h1>
          <p className="text-[#737373] mb-8">
            {t("product.productNotFoundDesc")}
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
          >
            {t("common.backToShop")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ProductView({
  product,
  related,
  variants,
}: {
  product: Product;
  related: Product[];
  variants: ProductVariant[];
}) {
  const t = useTranslations();
  const { isFavorite, toggle, hydrated } = useFavorites();
  const { add } = useCart();
  const toast = useToast();
  const favorited = hydrated && isFavorite(product.id);

  const sizeOptions = getSizeOptions(product.type, product.gender);
  const sizeKind = getSizeKind(product.type);
  const [size, setSize] = useState<string | null>(null);
  const [colorId, setColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);

  const activeVariants = useMemo(
    () => variants.filter((v) => v.isActive),
    [variants]
  );

  // Per-size stock summed across active color variants. A size that has no
  // matching variant row (legacy products created before the auto-insert)
  // is treated as out of stock, which surfaces a real "set stock in admin"
  // signal instead of letting customers proceed to checkout only to fail.
  const stockBySize = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of activeVariants) {
      if (!v.size) continue;
      map.set(v.size, (map.get(v.size) ?? 0) + Math.max(0, v.stock));
    }
    return map;
  }, [activeVariants]);

  const hasColorAxis = useMemo(
    () => activeVariants.some((v) => Boolean(v.colorId && v.color)),
    [activeVariants]
  );
  const hasSizeAxis =
    activeVariants.length > 0
      ? activeVariants.some((v) => Boolean(v.size))
      : sizeOptions.length > 0;

  const colorOptions = useMemo(() => {
    const map = new Map<string, { color: ProductColor; stock: number }>();
    for (const v of activeVariants) {
      if (!v.colorId || !v.color) continue;
      if (hasSizeAxis && v.size !== size) continue;
      const current = map.get(v.colorId);
      map.set(v.colorId, {
        color: v.color,
        stock: (current?.stock ?? 0) + Math.max(0, v.stock),
      });
    }
    return Array.from(map.values());
  }, [activeVariants, hasSizeAxis, size]);

  const totalStock = useMemo(() => {
    if (activeVariants.length > 0) {
      return activeVariants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
    }
    if (!hasSizeAxis) return product.stock ?? 0;
    let sum = 0;
    for (const s of sizeOptions) sum += stockBySize.get(s) ?? 0;
    return sum;
  }, [activeVariants, hasSizeAxis, product.stock, sizeOptions, stockBySize]);

  const selectedVariant = useMemo(() => {
    if (hasSizeAxis && !size) return null;
    if (hasColorAxis && colorOptions.length > 0 && !colorId) return null;
    return (
      activeVariants.find(
        (v) =>
          (v.size ?? null) === (hasSizeAxis ? size : null) &&
          (v.colorId ?? null) === (colorId ?? null)
      ) ?? null
    );
  }, [activeVariants, colorId, colorOptions.length, hasColorAxis, hasSizeAxis, size]);

  const selectedStock = selectedVariant
    ? Math.max(0, selectedVariant.stock)
    : size
      ? stockBySize.get(size) ?? 0
      : 0;
  const isSoldOut = totalStock === 0;
  const requiresColor = hasColorAxis && colorOptions.length > 0;
  const selectedColorValid =
    !requiresColor || colorOptions.some((opt) => opt.color.id === colorId);
  const selectedColor = selectedVariant?.color ?? null;
  const canPurchase =
    (!hasSizeAxis || Boolean(size)) &&
    (!requiresColor || (Boolean(colorId) && selectedColorValid)) &&
    (hasSizeAxis || requiresColor ? selectedStock > 0 : totalStock > 0);
  const quantityCap = hasSizeAxis || requiresColor
    ? Math.max(1, selectedStock)
    : Math.max(1, totalStock);
  const displayedQuantity = Math.min(quantity, quantityCap);

  // Prefer the full gallery loaded via product_images; fall back to the
  // primary image_path so legacy single-image products still render.
  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];
  const safeActive = Math.min(activeImage, Math.max(0, gallery.length - 1));

  const sizeLabel =
    sizeKind === "shoe" ? t("product.pointure") : t("product.size");

  function handleBuyNow() {
    if (hasSizeAxis && !size) {
      setSizeError(true);
      return;
    }
    if (requiresColor && (!colorId || !selectedColorValid)) {
      setColorError(true);
      return;
    }
    if (!canPurchase) return;
    setSizeError(false);
    setColorError(false);
    setOrderOpen(true);
  }

  function handleAddToCart() {
    if (hasSizeAxis && !size) {
      setSizeError(true);
      return;
    }
    if (requiresColor && (!colorId || !selectedColorValid)) {
      setColorError(true);
      return;
    }
    if (!canPurchase) return;
    setSizeError(false);
    setColorError(false);
    add(
      product.id,
      size,
      displayedQuantity,
      selectedColor
        ? {
            id: selectedColor.id,
            name: selectedColor.nameFr,
            hex: selectedColor.hex,
          }
        : null
    );
    toast.success(
      t("toast.addedToCart"),
      t("toast.addedToCartDesc", { name: product.name })
    );
    openCartDrawer();
  }

  function handleToggleFavorite() {
    const wasFavorited = favorited;
    toggle(product.id);
    if (wasFavorited) {
      toast.info(t("toast.removedFromFavorites"), product.name);
    } else {
      toast.success(t("toast.addedToFavorites"), product.name);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <nav className="text-sm text-[#737373] mb-8 flex flex-wrap items-center gap-2">
            <Link href="/" className="hover:text-[#0A0A0A] transition-colors">
              {t("product.breadcrumbHome")}
            </Link>
            <span>/</span>
            <Link
              href="/shop"
              className="hover:text-[#0A0A0A] transition-colors"
            >
              {t("nav.shop")}
            </Link>
            <span>/</span>
            <span className="text-[#0A0A0A] font-medium truncate">
              {product.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16">
            {/* Gallery */}
            <div className="flex gap-4">
              {/* Thumbnails column — only when there's more than one image */}
              {gallery.length > 1 && (
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <button
                    aria-label="Previous"
                    onClick={() =>
                      setActiveImage((i) => Math.max(0, i - 1))
                    }
                    className="w-9 h-9 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#525252] hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col gap-3">
                    {gallery.map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        onClick={() => setActiveImage(idx)}
                        className={cn(
                          "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
                          safeActive === idx
                            ? "border-[#0A0A0A]"
                            : "border-[#E5E5E5] hover:border-[#D4D4D4]"
                        )}
                      >
                        <Image
                          src={src}
                          alt={`${product.name} ${idx + 1}`}
                          width={160}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    aria-label="Next"
                    onClick={() =>
                      setActiveImage((i) => Math.min(gallery.length - 1, i + 1))
                    }
                    className="w-9 h-9 rounded-lg border border-[#E5E5E5] flex items-center justify-center text-[#525252] hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Main image */}
              <div className="flex-1 relative aspect-square bg-[#F5F5F5] rounded-2xl overflow-hidden">
                {product.isNew && (
                  <span className="absolute top-4 left-4 z-10 bg-[#DC2626] text-white text-xs font-bold uppercase tracking-widest w-14 h-14 rounded-full flex items-center justify-center shadow-md">
                    NEW
                  </span>
                )}
                {product.discount && (
                  <span className="absolute top-4 right-4 z-10 bg-[#DC2626] text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    -{product.discount}%
                  </span>
                )}
                {gallery.length > 0 ? (
                  <Image
                    src={gallery[safeActive]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#A3A3A3]">
                    {t("home.photoPlaceholder")}
                  </div>
                )}
                <button
                  aria-label="Zoom"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/95 text-[#525252] flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Info */}
            <div>
              {/* Prev/next placeholder */}
              <div className="flex items-center gap-1 text-[#A3A3A3] mb-5">
                <Link
                  href="/shop"
                  aria-label="Previous"
                  className="w-8 h-8 rounded-full hover:bg-[#F5F5F5] flex items-center justify-center hover:text-[#0A0A0A] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  href="/shop"
                  aria-label="All products"
                  className="w-8 h-8 rounded-full hover:bg-[#F5F5F5] flex items-center justify-center hover:text-[#0A0A0A] transition-colors text-xs"
                >
                  ⋯
                </Link>
                <Link
                  href="/shop"
                  aria-label="Next"
                  className="w-8 h-8 rounded-full hover:bg-[#F5F5F5] flex items-center justify-center hover:text-[#0A0A0A] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-[#0A0A0A] leading-tight mb-4">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-[#DC2626]">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-[#A3A3A3] line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Size selector */}
              {hasSizeAxis && (
                <div className="mb-5">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm font-semibold text-[#404040]">
                      {sizeLabel} :
                    </span>
                    {size && (
                      <button
                        onClick={() => setSize(null)}
                        className="text-sm text-[#737373] hover:text-[#DC2626] inline-flex items-center gap-1 transition-colors"
                      >
                        <span className="text-[10px]">✕</span>
                        {t("product.clearSize")}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((s) => {
                      const stock = stockBySize.get(s) ?? 0;
                      const disabled = stock === 0;
                      const selected = size === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={disabled}
                          aria-disabled={disabled}
                          aria-label={
                            disabled
                              ? `${s} — ${t("product.outOfStock")}`
                              : s
                          }
                          title={disabled ? t("product.outOfStock") : undefined}
                          onClick={() => {
                            if (disabled) return;
                            setSize(s);
                            setSizeError(false);
                          }}
                          className={cn(
                            "min-w-[52px] h-11 px-4 rounded-lg border-2 font-semibold text-sm transition-all",
                            disabled
                              ? "border-[#E5E5E5] text-[#A3A3A3] bg-[#FAFAFA] line-through cursor-not-allowed opacity-60"
                              : selected
                                ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                                : "border-[#E5E5E5] text-[#404040] hover:border-[#0A0A0A]"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  {sizeError && (
                    <p className="text-xs text-[#DC2626] mt-2">
                      {t("product.sizeRequired")}
                    </p>
                  )}
                </div>
              )}

              {/* Color selector */}
              {hasColorAxis && (!hasSizeAxis || size) && colorOptions.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm font-semibold text-[#404040]">
                      {t("product.color")} :
                    </span>
                    {colorId && (
                      <button
                        onClick={() => setColorId(null)}
                        className="text-sm text-[#737373] hover:text-[#DC2626] inline-flex items-center gap-1 transition-colors"
                      >
                        <span className="text-[10px]">✕</span>
                        {t("product.clearColor")}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map(({ color, stock }) => {
                      const disabled = stock === 0;
                      const selected = colorId === color.id;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          disabled={disabled}
                          aria-disabled={disabled}
                          aria-label={
                            disabled
                              ? `${color.nameFr} — ${t("product.outOfStock")}`
                              : color.nameFr
                          }
                          title={disabled ? t("product.outOfStock") : undefined}
                          onClick={() => {
                            if (disabled) return;
                            setColorId(color.id);
                            setColorError(false);
                          }}
                          className={cn(
                            "h-11 min-w-[120px] px-3 rounded-lg border-2 font-semibold text-sm transition-all inline-flex items-center justify-center gap-2",
                            disabled
                              ? "border-[#E5E5E5] text-[#A3A3A3] bg-[#FAFAFA] line-through cursor-not-allowed opacity-60"
                              : selected
                                ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                                : "border-[#E5E5E5] text-[#404040] hover:border-[#0A0A0A]"
                          )}
                        >
                          <span className="inline-flex h-5 w-5 overflow-hidden rounded-full border border-[#D4D4D4]">
                            <span
                              className="block h-full flex-1"
                              style={{ backgroundColor: color.hex }}
                            />
                            {color.hexSecondary && (
                              <span
                                className="block h-full flex-1"
                                style={{ backgroundColor: color.hexSecondary }}
                              />
                            )}
                          </span>
                          {color.nameFr}
                        </button>
                      );
                    })}
                  </div>
                  {colorError && (
                    <p className="text-xs text-[#DC2626] mt-2">
                      {t("product.colorRequired")}
                    </p>
                  )}
                </div>
              )}

              {/* Stock */}
              <div
                className={cn(
                  "flex items-center gap-2 text-sm mb-6",
                  isSoldOut ? "text-[#A3A3A3]" : "text-[#0A0A0A]",
                )}
              >
                <CheckCircle2
                  className={cn(
                    "w-4 h-4",
                    isSoldOut ? "text-[#A3A3A3]" : "text-[#DC2626]",
                  )}
                />
                <span className="font-medium">
                  {isSoldOut ? t("product.outOfStock") : t("product.inStock")}
                </span>
              </div>

              {/* Quantity + actions */}
              <div className="flex flex-wrap items-stretch gap-3 mb-6">
                <div className="inline-flex items-center border border-[#E5E5E5] rounded-lg overflow-hidden h-12">
                  <button
                    type="button"
                    aria-label={t("product.decrease")}
                    disabled={!canPurchase || displayedQuantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-full flex items-center justify-center text-[#525252] hover:bg-[#FAFAFA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-[#0A0A0A] font-semibold tabular-nums">
                    {displayedQuantity}
                  </span>
                  <button
                    type="button"
                    aria-label={t("product.increase")}
                    disabled={!canPurchase || displayedQuantity >= quantityCap}
                    onClick={() =>
                      setQuantity((q) => Math.min(quantityCap, q + 1))
                    }
                    className="w-10 h-full flex items-center justify-center text-[#525252] hover:bg-[#FAFAFA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={hasSizeAxis ? isSoldOut : !canPurchase}
                  className="flex-1 min-w-[180px] h-12 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors disabled:bg-[#E5E5E5] disabled:text-[#A3A3A3] disabled:cursor-not-allowed disabled:hover:bg-[#E5E5E5]"
                >
                  {isSoldOut ? t("product.outOfStock") : t("product.addToCart")}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={hasSizeAxis ? isSoldOut : !canPurchase}
                  className="flex-1 min-w-[180px] h-12 bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors disabled:bg-[#E5E5E5] disabled:text-[#A3A3A3] disabled:cursor-not-allowed disabled:hover:bg-[#E5E5E5]"
                >
                  {isSoldOut ? t("product.outOfStock") : t("product.buyNow")}
                </button>
              </div>

              {/* Wishlist + extras */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#525252] pb-6 border-b border-[#E5E5E5] mb-6">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={cn(
                    "inline-flex items-center gap-2 hover:text-[#DC2626] transition-colors",
                    favorited && "text-[#DC2626]"
                  )}
                >
                  <Heart
                    className="w-4 h-4"
                    fill={favorited ? "currentColor" : "none"}
                  />
                  {favorited
                    ? t("product.removeFromFavorites")
                    : t("product.addToFavorites")}
                </button>
              </div>

              {/* Meta */}
              <dl className="text-sm space-y-2 text-[#525252]">
                {/* <div className="flex gap-2">
                  <dt className="text-[#737373]">{t("product.sku")} :</dt>
                  <dd className="text-[#0A0A0A]">PEAK-{product.id.toUpperCase()}</dd>
                </div> */}
                <div className="flex gap-2">
                  <dt className="text-[#737373]">{t("product.categoryLabel")} :</dt>
                  <dd className="text-[#0A0A0A]">{product.category}</dd>
                </div>
              </dl>

              {/* Trust strip */}
              <div className="grid grid-cols-3 gap-3 mt-8">
                {[
                  { icon: Truck, label: t("home.features.delivery") },
                  { icon: RefreshCw, label: t("home.features.returns") },
                  { icon: Shield, label: t("home.features.payment") },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-center"
                  >
                    <Icon className="w-5 h-5 text-[#DC2626]" />
                    <span className="text-xs font-medium text-[#404040]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <section className="mt-20 pt-10 border-t border-[#E5E5E5]">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-4">
              {t("product.description")}
            </h2>
            <p className="text-[#525252] leading-relaxed max-w-3xl">
              {t("product.productDescription")}
            </p>
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-8">
                {t("product.relatedTitle")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />

      <OrderFormSheet
        open={orderOpen}
        onOpenChange={setOrderOpen}
        product={product}
        size={size}
        colorId={selectedColor?.id ?? null}
        colorName={selectedColor?.nameFr ?? null}
        colorHex={selectedColor?.hex ?? null}
        quantity={displayedQuantity}
      />
    </>
  );
}
