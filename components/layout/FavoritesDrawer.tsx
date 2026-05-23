"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatPrice, type Product } from "@/lib/mockdata";
import { productsRepo } from "@/lib/repository";
import { getSizeOptions } from "@/lib/products";
import { useFavorites } from "@/lib/useFavorites";
import { useCart } from "@/lib/useCart";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";

interface FavoritesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FavoritesDrawer({
  open,
  onOpenChange,
}: FavoritesDrawerProps) {
  const t = useTranslations();
  const toast = useToast();
  const { favorites, toggle } = useFavorites();
  const { add } = useCart();
  const [productsById, setProductsById] = useState<Record<string, Product>>({});

  useEffect(() => {
    const missing = favorites.filter((id) => !productsById[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    productsRepo.findManyByIds(missing).then((rows) => {
      if (cancelled) return;
      setProductsById((curr) => {
        const next = { ...curr };
        rows.forEach((p) => {
          next[p.id] = p;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [favorites, productsById]);

  function handleRemove(productId: string, productName: string) {
    toggle(productId);
    toast.info(t("toast.removedFromFavorites"), productName);
  }

  const items = favorites
    .map((id) => productsById[id])
    .filter((p): p is Product => Boolean(p));

  const count = items.length;
  const countLabel =
    count === 1
      ? t("favoritesDrawer.itemCount", { count })
      : t("favoritesDrawer.itemCountPlural", { count });

  function handleMoveToCart(
    id: string,
    type: Product["type"],
    gender: Product["gender"]
  ) {
    // For favorites we don't have a size picked — add with null size only if no size options.
    const sizes = getSizeOptions(type, gender);
    if (sizes.length > 0) {
      // Redirect to product detail to choose a size
      onOpenChange(false);
      return;
    }
    add(id, null, 1);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between bg-white">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#0A0A0A] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#DC2626]" fill="currentColor" />
              {t("favoritesDrawer.title")}
            </h2>
            {count > 0 && (
              <p className="text-xs text-[#737373] mt-0.5">{countLabel}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close")}
            className="text-[#525252] hover:text-[#0A0A0A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
            <div className="w-16 h-16 rounded-full bg-[#FAFAFA] text-[#A3A3A3] flex items-center justify-center mb-5">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#0A0A0A] mb-2">
              {t("favoritesDrawer.empty")}
            </h3>
            <p className="text-sm text-[#737373] max-w-xs mb-6">
              {t("favoritesDrawer.emptyHint")}
            </p>
            <Link
              href="/shop"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
            >
              {t("favoritesDrawer.keepShopping")}
            </Link>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-[#E5E5E5]">
            {items.map((product) => {
              const hasSizes =
                getSizeOptions(product.type, product.gender).length > 0;
              return (
                <li key={product.id} className="flex gap-4 p-4">
                  <Link
                    href={`/shop/${product.id}`}
                    onClick={() => onOpenChange(false)}
                    className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[#F5F5F5] relative"
                  >
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <Link
                        href={`/shop/${product.id}`}
                        onClick={() => onOpenChange(false)}
                        className="text-sm font-semibold text-[#0A0A0A] line-clamp-2 hover:text-[#DC2626] transition-colors"
                      >
                        {product.name}
                      </Link>
                      <button
                        onClick={() => handleRemove(product.id, product.name)}
                        aria-label={t("favoritesDrawer.remove")}
                        className="text-[#A3A3A3] hover:text-[#DC2626] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="font-bold text-[#DC2626] text-sm mb-3">
                      {formatPrice(product.price)}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {hasSizes ? (
                        <Link
                          href={`/shop/${product.id}`}
                          onClick={() => onOpenChange(false)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-md transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {t("favoritesDrawer.viewProduct")}
                        </Link>
                      ) : (
                        <button
                          onClick={() =>
                            handleMoveToCart(
                              product.id,
                              product.type,
                              product.gender
                            )
                          }
                          className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-md transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {t("favoritesDrawer.moveToCart")}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
