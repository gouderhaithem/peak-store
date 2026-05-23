"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { ordersRepo } from "@/lib/repository";
import { formatPrice } from "@/lib/mockdata";
import { type OrderRecord, type OrderStatus } from "@/lib/orders";
import { useTranslations, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function statusLabel(status: OrderStatus, t: (k: string) => string): string {
  const map: Record<OrderStatus, string> = {
    pending: t("admin.statusPending"),
    confirmed: t("admin.statusConfirmed"),
    shipped: t("admin.statusShipped"),
    delivered: t("admin.statusDelivered"),
    cancelled: t("admin.statusCancelled"),
  };
  return map[status];
}

export default function AccountOrdersPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ordersRepo
      .listMine()
      .then((rows) => {
        if (!cancelled) {
          setOrders(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-DZ" : locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-[#0A0A0A] mb-1">
          {t("auth.myOrders")}
        </h2>
        <p className="text-sm text-[#737373]">{t("account.ordersSubtitle")}</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-[#E5E5E5] animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E5E5] py-20 text-center">
          <ShoppingBag className="w-12 h-12 text-[#D4D4D4] mx-auto mb-4" />
          <p className="text-[#737373] font-medium mb-6">{t("account.noOrders")}</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {t("common.shopNow")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#E5E5E5] p-5 hover:border-[#D4D4D4] transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-[#0A0A0A]">{order.id}</span>
                      <span
                        className={cn(
                          "text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                          STATUS_STYLES[order.status]
                        )}
                      >
                        {statusLabel(order.status, t)}
                      </span>
                    </div>
                    <p className="text-sm text-[#737373]">
                      {dateFmt(order.createdAt)} &middot; {itemCount}{" "}
                      {itemCount === 1 ? t("account.item") : t("account.items")}
                    </p>
                    <p className="text-xs text-[#A3A3A3]">
                      {order.customer.wilaya}, {order.customer.commune}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-[#DC2626]">
                      {formatPrice(order.subtotal)}
                    </p>
                    <Link
                      href={`/checkout/success?order=${order.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#0A0A0A] hover:text-[#DC2626] transition-colors"
                    >
                      {t("account.viewOrder")}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Items preview */}
                {order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#F5F5F5] flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-[#FAFAFA] border border-[#E5E5E5] text-[#525252] px-2.5 py-1 rounded-full"
                      >
                        {item.productName}
                        {item.size ? ` · ${item.size}` : ""}
                        {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-[#A3A3A3] px-2.5 py-1">
                        +{order.items.length - 3} {t("account.more")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
