"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatPrice, type Product } from "@/lib/mockdata";
import { getSizeKind } from "@/lib/products";
import { ordersRepo, productsRepo } from "@/lib/repository";
import { type OrderRecord } from "@/lib/orders";
import { WILAYAS } from "@/lib/wilayas";
import { useLocale, useTranslations } from "@/lib/i18n";
import { findGuestOrderReceipt } from "@/app/actions/orders";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessView />
    </Suspense>
  );
}

function SuccessView() {
  const t = useTranslations();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [hydrated, setHydrated] = useState(!orderId);

  useEffect(() => {
    let cancelled = false;
    if (!orderId) {
      return;
    }
    ordersRepo.findById(orderId).then(async (found) => {
      if (cancelled) return;
      let resolved = found;
      if (!resolved) {
        const phone = window.sessionStorage.getItem(
          `peak:order-phone:${orderId}`
        );
        if (phone) {
          resolved = await findGuestOrderReceipt(orderId, phone);
          if (cancelled) return;
        }
      }

      setOrder(resolved);
      if (resolved) {
        const uniqueIds = Array.from(
          new Set(resolved.items.map((i) => i.productId).filter(Boolean))
        );
        const rows = await productsRepo.findManyByIds(uniqueIds);
        if (cancelled) return;
        const map: Record<string, Product> = {};
        rows.forEach((p) => {
          map[p.id] = p;
        });
        setProductsById(map);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!hydrated) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-[#FAFAFA]" />
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-[#FAFAFA] py-20 md:py-28">
          <div className="max-w-[600px] mx-auto px-6 text-center">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3">
              {t("order.notFound")}
            </h1>
            <p className="text-[#525252] mb-8">{t("order.notFoundDesc")}</p>
            <Link
              href="/shop"
              className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
            >
              {t("checkout.backToShop")}
            </Link>
          </div>
        </main>
        <Footer />
      </>
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
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAFAFA] py-12 md:py-16">
        <div className="max-w-[900px] mx-auto px-6">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-2">
              {t("order.success")}
            </h1>
            <p className="text-[#525252] max-w-md mx-auto">
              {t("order.successDesc")}
            </p>
          </div>

          {/* Order header card */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8 mb-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#737373] mb-1">
                  {t("order.orderNumber")}
                </p>
                <p className="font-heading text-2xl font-bold text-[#0A0A0A]">
                  {order.id}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#737373] mb-1">
                  {t("order.placedOn")}
                </p>
                <p className="text-[#0A0A0A] font-medium">{placedOn}</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-6">
            {/* Delivery */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8">
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
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#DC2626]" />
                <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
                  {t("order.paymentMethod")}
                </h2>
              </div>
              <p className="text-sm font-semibold text-[#0A0A0A] mb-1">
                {t("order.cod")}
              </p>
              <p className="text-sm text-[#525252]">{t("order.codDesc")}</p>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8 mb-6">
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
                        <span>{t("checkout.each")} {item.quantity}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#DC2626] shrink-0">
                      {formatPrice(unitPrice * item.quantity)}
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* Totals */}
            <div className="pt-5 mt-5 border-t border-[#E5E5E5] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#525252]">{t("order.subtotal")}</span>
                <span className="text-[#0A0A0A] font-medium">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525252]">{t("order.deliveryFee")}</span>
                <span className="text-[#737373] text-xs italic">
                  {t("order.deliveryEstimate")}
                </span>
              </div>
              <div className="flex justify-between font-bold border-t border-[#E5E5E5] pt-3 mt-1">
                <span className="text-[#0A0A0A]">{t("order.total")}</span>
                <span className="text-[#DC2626] text-lg">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/shop"
              className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
            >
              {t("order.continueShopping")}
            </Link>
            <Link
              href="/"
              className="h-11 px-6 inline-flex items-center bg-white border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg transition-colors"
            >
              {t("nav.home")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
