"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTranslations, useLocale } from "@/lib/i18n";
import { WILAYAS } from "@/lib/wilayas";
import { formatPrice, type Product } from "@/lib/mockdata";
import { ordersRepo } from "@/lib/repository";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface OrderFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  size: string | null;
  colorId?: string | null;
  colorName?: string | null;
  colorHex?: string | null;
  quantity: number;
}

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

export default function OrderFormSheet({
  open,
  onOpenChange,
  product,
  size,
  colorId,
  colorName,
  colorHex,
  quantity,
}: OrderFormSheetProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => {
        setSuccess(false);
        setOrderNumber(null);
        setErrors({});
      }, 300);
      return () => clearTimeout(id);
    }
  }, [open]);

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
        items: [
          {
            productId: product.id,
            size,
            colorId: colorId ?? null,
            colorName: colorName ?? null,
            colorHex: colorHex ?? null,
            productName: product.name,
            unitPrice: product.price,
            quantity,
          },
        ],
        customer: { ...form },
        subtotal,
      });
      window.sessionStorage.setItem(
        `peak:order-phone:${record.id}`,
        form.phone.trim()
      );
      setOrderNumber(record.id);
      toast.success(t("toast.orderConfirmed"), record.id);
      setSubmitting(false);
      setSuccess(true);
      setForm(emptyForm);
      router.prefetch(`/checkout/success?id=${encodeURIComponent(record.id)}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : t("checkout.submitFailed");
      toast.error(t("checkout.submitFailedTitle"), message);
      setSubmitting(false);
    }
  }

  const subtotal = product.price * quantity;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
        showCloseButton={false}
      >
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-[#0A0A0A] mb-2">
              {t("order.success")}
            </h3>
            <p className="text-[#737373] mb-8 max-w-sm">
              {t("order.successDesc")}
            </p>
            {orderNumber && (
              <div className="mb-8 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#737373] mb-1">
                  {t("order.orderNumber")}
                </p>
                <p className="font-heading text-lg font-bold text-[#0A0A0A]">
                  {orderNumber}
                </p>
              </div>
            )}
            {orderNumber && (
              <button
                onClick={() =>
                  router.push(
                    `/checkout/success?id=${encodeURIComponent(orderNumber)}`
                  )
                }
                className="h-11 px-6 inline-flex items-center bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors mb-3"
              >
                {t("order.viewReceipt")}
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
            >
              {t("order.continueShopping")}
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
                  {t("order.title")}
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  {t("order.subtitle")}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label={t("common.close")}
                className="text-[#525252] hover:text-[#0A0A0A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
              {/* Order summary */}
              <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#737373] mb-3">
                  {t("order.summary")}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#525252]">{t("order.product")}</span>
                    <span className="text-[#0A0A0A] font-medium text-end">
                      {product.name}
                    </span>
                  </div>
                  {size && (
                    <div className="flex justify-between">
                      <span className="text-[#525252]">{t("order.size")}</span>
                      <span className="text-[#0A0A0A] font-medium">{size}</span>
                    </div>
                  )}
                  {colorName && (
                    <div className="flex justify-between">
                      <span className="text-[#525252]">
                        {t("product.color")}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#0A0A0A] font-medium">
                        {colorHex && (
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-[#D4D4D4]"
                            style={{ backgroundColor: colorHex }}
                          />
                        )}
                        {colorName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#525252]">{t("order.quantity")}</span>
                    <span className="text-[#0A0A0A] font-medium">
                      {quantity.toLocaleString(locale === "ar" ? "ar-DZ" : locale)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#525252]">{t("order.subtotal")}</span>
                    <span className="text-[#0A0A0A] font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#525252]">{t("order.deliveryFee")}</span>
                    <span className="text-[#737373] text-xs italic">
                      {t("order.deliveryEstimate")}
                    </span>
                  </div>
                  <div className="border-t border-[#E5E5E5] pt-2 mt-2 flex justify-between font-semibold">
                    <span className="text-[#0A0A0A]">{t("order.total")}</span>
                    <span className="text-[#DC2626] text-base">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer details */}
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
                  className={cn(inputCls(!!errors.wilaya), "pr-8")}
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

              {/* Payment method */}
              <div>
                <label className="block text-sm font-semibold text-[#404040] mb-2">
                  {t("order.paymentMethod")}
                </label>
                <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-[#DC2626] bg-[#FEF2F2]">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-white text-[#DC2626] flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0A0A0A] text-sm">
                      {t("order.cod")}
                    </p>
                    <p className="text-xs text-[#525252] mt-0.5">
                      {t("order.codDesc")}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t("order.submitting") : t("order.confirm")}
              </button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
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
