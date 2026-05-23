"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatPrice, type Product } from "@/lib/mockdata";
import { productsRepo } from "@/lib/repository";
import { getSizeKind } from "@/lib/products";
import { useCart, type CartItem } from "@/lib/useCart";
import { useTranslations } from "@/lib/i18n";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const t = useTranslations();
  const { items, updateQuantity, remove, clear, count } = useCart();
  const [productsById, setProductsById] = useState<Record<string, Product>>({});

  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.productId))).filter(
      (id) => !productsById[id]
    );
    if (ids.length === 0) return;
    let cancelled = false;
    productsRepo.findManyByIds(ids).then((rows) => {
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
  }, [items, productsById]);

  const validItems = items
    .map((it) => ({ item: it, product: productsById[it.productId] }))
    .filter(
      (x): x is { item: CartItem; product: Product } => Boolean(x.product)
    );

  const subtotal = validItems.reduce(
    (sum, { item, product }) => sum + product.price * item.quantity,
    0
  );

  const countLabel = count === 1 ? t("cart.itemCount", { count }) : t("cart.itemCountPlural", { count });

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
              <ShoppingBag className="w-5 h-5 text-[#DC2626]" />
              {t("cart.title")}
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
        {validItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
            <div className="w-16 h-16 rounded-full bg-[#FAFAFA] text-[#A3A3A3] flex items-center justify-center mb-5">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#0A0A0A] mb-2">
              {t("cart.empty")}
            </h3>
            <p className="text-sm text-[#737373] max-w-xs mb-6">
              {t("cart.emptyHint")}
            </p>
            <button
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
            >
              <Link href="/shop" onClick={() => onOpenChange(false)}>
                {t("cart.startShopping")}
              </Link>
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto divide-y divide-[#E5E5E5]">
              {validItems.map(({ item, product }) => {
                const sizeLabel =
                  getSizeKind(product.type) === "shoe"
                    ? t("cart.pointure")
                    : t("cart.size");
                return (
                  <li
                    key={`${item.productId}-${item.size ?? "_"}-${item.colorId ?? "_"}`}
                    className="flex gap-4 p-4"
                  >
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
                          onClick={() =>
                            remove(item.productId, item.size, item.colorId)
                          }
                          aria-label={t("cart.remove")}
                          className="text-[#A3A3A3] hover:text-[#DC2626] transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.size && (
                        <p className="text-xs text-[#737373] mb-2">
                          {sizeLabel} : <span className="text-[#0A0A0A] font-medium">{item.size}</span>
                        </p>
                      )}
                      {item.colorName && (
                        <p className="text-xs text-[#737373] mb-2 inline-flex items-center gap-1.5">
                          {t("product.color")}:
                          {item.colorHex && (
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-[#D4D4D4]"
                              style={{ backgroundColor: item.colorHex }}
                            />
                          )}
                          <span className="text-[#0A0A0A] font-medium">
                            {item.colorName}
                          </span>
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#E5E5E5] rounded-lg overflow-hidden">
                          <button
                            type="button"
                            aria-label={t("product.decrease")}
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.quantity - 1,
                                item.colorId
                              )
                            }
                            className="w-7 h-8 flex items-center justify-center text-[#525252] hover:bg-[#FAFAFA] transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-[#0A0A0A] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={t("product.increase")}
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.quantity + 1,
                                item.colorId
                              )
                            }
                            className="w-7 h-8 flex items-center justify-center text-[#525252] hover:bg-[#FAFAFA] transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-[#DC2626] text-sm">
                          {formatPrice(product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="shrink-0 border-t border-[#E5E5E5] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#525252]">
                  {t("cart.subtotal")}
                </span>
                <span className="font-bold text-[#0A0A0A] text-lg">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-[#737373] -mt-2">
                {t("cart.deliveryNote")}
              </p>
              <Link
                href="/checkout"
                onClick={() => onOpenChange(false)}
                className="block w-full h-12 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors text-center leading-[3rem]"
              >
                {t("cart.checkout")}
              </Link>
              <button
                onClick={clear}
                className="block w-full text-center text-sm text-[#737373] hover:text-[#DC2626] transition-colors"
              >
                {t("cart.clearCart")}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
