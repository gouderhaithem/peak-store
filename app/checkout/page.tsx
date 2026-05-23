"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, ShoppingBag, Trash2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatPrice, type Product } from "@/lib/mockdata";
import { getSizeKind } from "@/lib/products";
import { useCart, type CartItem } from "@/lib/useCart";
import { ordersRepo, productsRepo } from "@/lib/repository";
import { useTranslations, useLocale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { WILAYAS } from "@/lib/wilayas";
import { cn } from "@/lib/utils";

interface FormState {
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  note: string;
}

const emptyForm: FormState = {
  fullName: "",
  phone: "",
  wilaya: "",
  commune: "",
  address: "",
  note: "",
};

type Resolved = { item: CartItem; product: Product };

export default function CheckoutPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const { items, remove, clear, hydrated } = useCart();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});

  useEffect(() => {
    const missing = Array.from(new Set(items.map((i) => i.productId))).filter(
      (id) => !productsById[id]
    );
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
  }, [items, productsById]);

  // Resolve cart items into products
  const resolved: Resolved[] = items
    .map((item) => ({ item, product: productsById[item.productId] }))
    .filter((x): x is Resolved => Boolean(x.product));

  const itemCount = resolved.reduce((sum, { item }) => sum + item.quantity, 0);
  const subtotal = resolved.reduce(
    (sum, { item, product }) => sum + product.price * item.quantity,
    0
  );

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.fullName.trim()) next.fullName = t("order.fieldRequired");
    if (!form.phone.trim()) next.phone = t("order.fieldRequired");
    else if (!/^[+\d\s-]{8,}$/.test(form.phone.trim()))
      next.phone = t("order.phoneInvalid");
    if (!form.wilaya) next.wilaya = t("order.fieldRequired");
    if (!form.commune.trim()) next.commune = t("order.fieldRequired");
    if (!form.address.trim()) next.address = t("order.fieldRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const record = await ordersRepo.create({
        items,
        customer: { ...form },
        subtotal,
      });
      window.sessionStorage.setItem(
        `peak:order-phone:${record.id}`,
        form.phone.trim()
      );
      clear();
      setForm(emptyForm);
      toast.success(t("toast.orderConfirmed"), record.id);
      router.push(`/checkout/success?id=${encodeURIComponent(record.id)}`);
    } catch (err) {
      // Server-side rejections (a product was soft-deleted between cart
      // add and checkout, a size variant was removed by an admin, etc.)
      // surface here. Keep the cart intact so the customer can retry.
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : t("checkout.submitFailed");
      toast.error(t("checkout.submitFailedTitle"), message);
    } finally {
      setSubmitting(false);
    }
  }

  // --- Empty cart view ------------------------------------------------------
  if (hydrated && resolved.length === 0) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-[#FAFAFA] py-20 md:py-28">
          <div className="max-w-[600px] mx-auto px-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-white border border-[#E5E5E5] text-[#A3A3A3] flex items-center justify-center mb-6">
              <ShoppingBag className="w-9 h-9" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3">
              {t("checkout.emptyTitle")}
            </h1>
            <p className="text-[#525252] mb-8">{t("checkout.emptyText")}</p>
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

  const itemsLabel =
    itemCount === 1
      ? t("checkout.itemsCount", { count: itemCount })
      : t("checkout.itemsCountPlural", { count: itemCount });

  // --- Checkout view --------------------------------------------------------
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAFAFA] py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Header */}
          <nav className="text-sm text-[#737373] mb-4 flex flex-wrap items-center gap-2">
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
            <span className="text-[#0A0A0A] font-medium">
              {t("checkout.pageTitle")}
            </span>
          </nav>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-2">
            {t("checkout.hero")}
          </h1>
          <p className="text-[#525252] mb-10 max-w-2xl">
            {t("checkout.subtitle")}
          </p>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8"
          >
            {/* LEFT — Customer + payment */}
            <div className="space-y-6">
              {/* Customer info */}
              <section className="bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8">
                <h2 className="font-heading text-xl font-bold text-[#0A0A0A] mb-6">
                  {t("checkout.customerSection")}
                </h2>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field
                    label={t("order.fullName")}
                    error={errors.fullName}
                    required
                  >
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) =>
                        setForm({ ...form, fullName: e.target.value })
                      }
                      placeholder={t("order.fullNamePlaceholder")}
                      className={inputCls(!!errors.fullName)}
                    />
                  </Field>

                  <Field
                    label={t("order.phone")}
                    error={errors.phone}
                    required
                  >
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder={t("order.phonePlaceholder")}
                      className={inputCls(!!errors.phone)}
                    />
                  </Field>

                  <Field
                    label={t("order.wilaya")}
                    error={errors.wilaya}
                    required
                  >
                    <select
                      value={form.wilaya}
                      onChange={(e) =>
                        setForm({ ...form, wilaya: e.target.value })
                      }
                      className={inputCls(!!errors.wilaya)}
                    >
                      <option value="">{t("order.selectWilaya")}</option>
                      {WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} — {locale === "ar" ? w.nameAr : w.nameFr}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label={t("order.commune")}
                    error={errors.commune}
                    required
                  >
                    <input
                      type="text"
                      value={form.commune}
                      onChange={(e) =>
                        setForm({ ...form, commune: e.target.value })
                      }
                      placeholder={t("order.communePlaceholder")}
                      className={inputCls(!!errors.commune)}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field
                      label={t("order.address")}
                      error={errors.address}
                      required
                    >
                      <textarea
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        placeholder={t("order.addressPlaceholder")}
                        rows={3}
                        className={cn(inputCls(!!errors.address), "h-auto py-3")}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label={t("order.note")}>
                      <textarea
                        value={form.note}
                        onChange={(e) =>
                          setForm({ ...form, note: e.target.value })
                        }
                        placeholder={t("order.notePlaceholder")}
                        rows={2}
                        className={cn(inputCls(false), "h-auto py-3")}
                      />
                    </Field>
                  </div>
                </div>
              </section>

              {/* Payment */}
              <section className="bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8">
                <h2 className="font-heading text-xl font-bold text-[#0A0A0A] mb-6">
                  {t("checkout.paymentSection")}
                </h2>
                <div className="flex items-start gap-4 p-5 rounded-xl border-2 border-[#DC2626] bg-[#FEF2F2]">
                  <div className="w-11 h-11 shrink-0 rounded-lg bg-white text-[#DC2626] flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0A0A0A]">
                      {t("order.cod")}
                    </p>
                    <p className="text-sm text-[#525252] mt-0.5">
                      {t("order.codDesc")}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT — Order summary */}
            <aside className="lg:sticky lg:top-[100px] lg:h-fit space-y-6">
              <section className="bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-bold text-[#0A0A0A]">
                    {t("checkout.summarySection")}
                  </h2>
                  <span className="text-xs font-semibold text-[#737373]">
                    {itemsLabel}
                  </span>
                </div>

                <ul className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-1 -mr-1">
                  {resolved.map(({ item, product }) => {
                    const sizeLabel =
                      getSizeKind(product.type) === "shoe"
                        ? t("cart.pointure")
                        : t("cart.size");
                    return (
                      <li
                        key={`${item.productId}-${item.size ?? "_"}-${item.colorId ?? "_"}`}
                        className="flex gap-3"
                      >
                        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] relative">
                          {product.image && (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold text-[#0A0A0A] line-clamp-2">
                              {product.name}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                remove(item.productId, item.size, item.colorId)
                              }
                              aria-label={t("cart.remove")}
                              className="text-[#A3A3A3] hover:text-[#DC2626] transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-[#737373]">
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
                          <p className="text-sm font-bold text-[#DC2626] mt-1">
                            {formatPrice(product.price * item.quantity)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-2 pt-5 border-t border-[#E5E5E5] text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#525252]">{t("order.subtotal")}</span>
                    <span className="text-[#0A0A0A] font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#525252]">
                      {t("order.deliveryFee")}
                    </span>
                    <span className="text-[#737373] text-xs italic">
                      {t("order.deliveryEstimate")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-[#E5E5E5] pt-3 mt-2">
                    <span className="text-[#0A0A0A]">{t("order.total")}</span>
                    <span className="text-[#DC2626] text-lg">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 mt-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? t("order.submitting") : t("order.confirm")}
                </button>

                <Link
                  href="/shop"
                  className="block text-center text-sm text-[#737373] hover:text-[#0A0A0A] transition-colors mt-4"
                >
                  {t("order.continueShopping")}
                </Link>
              </section>
            </aside>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full h-11 px-4 rounded-lg border bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 transition resize-none",
    hasError
      ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20"
      : "border-[#E5E5E5] focus:border-[#0A0A0A] focus:ring-[#0A0A0A]/10"
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#404040] mb-2">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[#DC2626] mt-1.5">{error}</p>}
    </div>
  );
}
