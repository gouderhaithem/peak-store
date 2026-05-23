"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Banknote, MapPin, Package } from "lucide-react";
import { type OrderRecord, type OrderStatus } from "@/lib/orders";
import { ordersRepo, productsRepo } from "@/lib/repository";
import { formatPrice, type Product } from "@/lib/mockdata";
import { getSizeKind } from "@/lib/products";
import { WILAYAS } from "@/lib/wilayas";
import { useTranslations, useLocale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

function statusLabel(status: OrderStatus, t: (k: string) => string) {
  switch (status) {
    case "pending":
      return t("admin.statusPending");
    case "confirmed":
      return t("admin.statusConfirmed");
    case "shipped":
      return t("admin.statusShipped");
    case "delivered":
      return t("admin.statusDelivered");
    case "cancelled":
      return t("admin.statusCancelled");
  }
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations();
  const { locale } = useLocale();
  const toast = useToast();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [hydrated, setHydrated] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    ordersRepo.findById(id).then(async (found) => {
      if (cancelled) return;
      setOrder(found);
      if (found) {
        const uniqueIds = Array.from(
          new Set(found.items.map((i) => i.productId).filter(Boolean))
        );
        const loaded = await Promise.all(
          uniqueIds.map((pid) => productsRepo.findById(pid))
        );
        if (cancelled) return;
        const map: Record<string, Product> = {};
        loaded.forEach((p, idx) => {
          if (p) map[uniqueIds[idx]] = p;
        });
        setProductsById(map);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleStatusChange(status: OrderStatus) {
    if (status === order?.status || loadingStatus) return;
    setLoadingStatus(status);
    try {
      const updated = await ordersRepo.updateStatus(id, status);
      if (updated) {
        setOrder(updated);
        toast.success(t("admin.updateStatus"), statusLabel(status, t));
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to update order status";
      toast.error(t("admin.updateStatus"), message);
    } finally {
      setLoadingStatus(null);
    }
  }

  if (!hydrated) {
    return <div />;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h1 className="font-heading text-2xl font-bold text-[#0A0A0A] mb-3">
          {t("order.notFound")}
        </h1>
        <p className="text-[#525252] mb-6">{t("order.notFoundDesc")}</p>
        <Link
          href="/admin/orders"
          className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("admin.orders")}
        </Link>
      </div>
    );
  }

  const wilaya = WILAYAS.find((w) => w.code === order.customer.wilaya);
  const wilayaName = wilaya
    ? `${wilaya.code} — ${locale === "ar" ? wilaya.nameAr : wilaya.nameFr}`
    : order.customer.wilaya;

  const placedOn = new Date(order.createdAt).toLocaleString(
    locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR",
    { dateStyle: "long", timeStyle: "short" }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#0A0A0A] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("admin.orders")}
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A]">
            {order.id}
          </h1>
          <p className="text-sm text-[#737373] mt-1">{placedOn}</p>
        </div>
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border",
            STATUS_STYLES[order.status]
          )}
        >
          {statusLabel(order.status, t)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
            <h2 className="font-heading text-lg font-bold text-[#0A0A0A] mb-5">
              {t("order.items")}
            </h2>
            <ul className="space-y-4">
              {order.items.map((item) => {
                const product = productsById[item.productId];
                const sizeLabel =
                  product && getSizeKind(product.type) === "shoe"
                    ? t("cart.pointure")
                    : t("cart.size");
                const name = item.productName ?? product?.name ?? t("order.product");
                const unitPrice = item.unitPrice ?? product?.price ?? 0;
                return (
                  <li
                    key={`${item.productId}-${item.size ?? "_"}-${item.colorHex ?? item.colorName ?? "_"}`}
                    className="flex gap-4 pb-4 last:pb-0 border-b last:border-b-0 border-[#E5E5E5]"
                  >
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] relative">
                      {product?.image && (
                        <Image
                          src={product.image}
                          alt={name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0A0A0A] line-clamp-2">
                        {name}
                      </p>
                      <div className="flex flex-wrap gap-x-3 text-xs text-[#737373] mt-1">
                        {item.size && (
                          <span>
                            {sizeLabel}:{" "}
                            <span className="text-[#0A0A0A] font-medium">
                              {item.size}
                            </span>
                          </span>
                        )}
                        {item.colorName && (
                          <span className="inline-flex items-center gap-1.5">
                            {t("product.color")}:{" "}
                            {item.colorHex && (
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-[#D4D4D4]"
                                style={{ backgroundColor: item.colorHex }}
                              />
                            )}
                            <span className="text-[#0A0A0A] font-medium">
                              {item.colorName}
                            </span>
                          </span>
                        )}
                        <span>
                          {t("checkout.each")} {item.quantity}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#DC2626] shrink-0">
                      {formatPrice(unitPrice * item.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="pt-5 mt-5 border-t border-[#E5E5E5] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#525252]">{t("order.subtotal")}</span>
                <span className="text-[#0A0A0A] font-medium">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t border-[#E5E5E5] pt-3 mt-1">
                <span className="text-[#0A0A0A]">{t("order.total")}</span>
                <span className="text-[#DC2626] text-lg">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
            </div>
          </section>

          {/* Customer */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#DC2626]" />
              <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
                {t("order.deliveryAddress")}
              </h2>
            </div>
            <div className="text-sm text-[#404040] space-y-1.5">
              <p className="font-semibold text-[#0A0A0A]">
                {order.customer.fullName}
              </p>
              <p>{order.customer.phone}</p>
              <p>{order.customer.address}</p>
              <p>
                {order.customer.commune}, {wilayaName}
              </p>
              {order.customer.note && (
                <p className="text-[#737373] italic pt-2 border-t border-[#E5E5E5] mt-2">
                  {order.customer.note}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <aside className="space-y-6">
          {/* Status */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#DC2626]" />
              <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
                {t("admin.updateStatus")}
              </h2>
            </div>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={Boolean(loadingStatus)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors",
                    order.status === s
                      ? "border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]"
                      : "border-[#E5E5E5] text-[#404040] hover:border-[#0A0A0A]",
                    loadingStatus && "opacity-60 cursor-wait"
                  )}
                >
                  {loadingStatus === s
                    ? `${statusLabel(s, t)}…`
                    : statusLabel(s, t)}
                </button>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="w-5 h-5 text-[#DC2626]" />
              <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
                {t("order.paymentMethod")}
              </h2>
            </div>
            <p className="text-sm font-semibold text-[#0A0A0A] mb-1">
              {t("order.cod")}
            </p>
            <p className="text-sm text-[#525252]">{t("order.codDesc")}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
