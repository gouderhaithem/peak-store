"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Package,
  Save,
  Star,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { type Product } from "@/lib/mockdata";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { productsRepo } from "@/lib/repository";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface AdminProductForm {
  name: string;
  category: string;
  type: Product["type"];
  gender: Product["gender"];
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  status: "active" | "draft";
  isNew: boolean;
  images: string[];
  description: string;
}

const TYPES: Product["type"][] = [
  "running",
  "basketball",
  "casual",
  "training",
  "apparel",
];
const GENDERS: Product["gender"][] = ["men", "women", "kids", "unisex"];

const inputCls =
  "w-full h-11 px-4 rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition";

function buildInitialImages(p: Product): string[] {
  if (p.images && p.images.length > 0) return p.images;
  return p.image ? [p.image] : [];
}

export function buildFormFromProduct(p: Product): AdminProductForm {
  return {
    name: p.name,
    category: p.category,
    type: p.type,
    gender: p.gender,
    price: p.price,
    originalPrice: p.originalPrice ?? 0,
    discount: p.discount ?? 0,
    stock: p.stock ?? 0,
    // The DB has a single is_active flag; the UI calls the two states
    // "active" / "draft". Default to active if the detail fetch hasn't
    // returned yet (undefined), since active is the schema default too.
    status: p.isActive === false ? "draft" : "active",
    isNew: p.isNew ?? false,
    images: buildInitialImages(p),
    description: p.description ?? "",
  };
}

export function buildEmptyForm(): AdminProductForm {
  return {
    name: "",
    category: "",
    type: "running",
    gender: "men",
    price: 0,
    originalPrice: 0,
    discount: 0,
    stock: 0,
    status: "draft",
    isNew: false,
    images: [],
    description: "",
  };
}

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialProduct?: Product;
}

export default function ProductForm({
  mode,
  productId,
  initialProduct,
}: ProductFormProps) {
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();

  // Track baseline (last-saved state) as actual state so a successful save
  // can re-baseline without waiting for the parent to re-fetch — that flow
  // would otherwise leave the "unsaved changes" banner stuck on after save.
  const initial = useMemo<AdminProductForm>(
    () =>
      initialProduct ? buildFormFromProduct(initialProduct) : buildEmptyForm(),
    [initialProduct]
  );
  const [baseline, setBaseline] = useState<AdminProductForm>(initial);
  const [form, setForm] = useState<AdminProductForm>(initial);

  // If the parent passes a new initialProduct (e.g., navigating between
  // products without unmounting), reset both baseline and form.
  useEffect(() => {
    setBaseline(initial);
    setForm(initial);
  }, [initial]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Pending files keyed by their preview blob URL. When the user picks an
  // image we only generate an object URL; the actual storage upload runs in
  // handleSubmit so a cancelled form never leaves orphans in the bucket.
  const pendingFilesRef = useRef<Map<string, File>>(new Map());

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline]
  );

  function update<K extends keyof AdminProductForm>(
    key: K,
    value: AdminProductForm[K]
  ) {
    setForm((curr) => ({ ...curr, [key]: value }));
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setSubmitError(null);
    try {
      const previewUrls: string[] = [];
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not an image`);
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(`${file.name} is larger than 5 MB`);
        }
        const previewUrl = URL.createObjectURL(file);
        pendingFilesRef.current.set(previewUrl, file);
        previewUrls.push(previewUrl);
      }
      setForm((curr) => ({
        ...curr,
        images: [...curr.images, ...previewUrls],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not add file";
      setSubmitError(message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setForm((curr) => {
      const dropped = curr.images[index];
      if (dropped && pendingFilesRef.current.has(dropped)) {
        URL.revokeObjectURL(dropped);
        pendingFilesRef.current.delete(dropped);
      }
      return { ...curr, images: curr.images.filter((_, i) => i !== index) };
    });
  }
  function setPrimary(index: number) {
    setForm((curr) => {
      if (index === 0) return curr;
      const moved = curr.images[index];
      return {
        ...curr,
        images: [moved, ...curr.images.filter((_, i) => i !== index)],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (form.images.length === 0) {
      setSubmitError(t("admin.noImages"));
      return;
    }
    if (!form.name.trim() || form.price <= 0) {
      // The button is already disabled when these are false; this guard
      // covers the Enter-key path.
      return;
    }
    if (form.originalPrice > 0 && form.originalPrice < form.price) {
      setSubmitError(
        "Original price must be greater than or equal to current price.",
      );
      return;
    }
    if (mode === "edit" && !productId) {
      setSubmitError("Missing product id");
      return;
    }

    setSubmitting(true);
    try {
      // Upload any pending local files now, then map blob preview URLs
      // back to their resulting public Supabase URLs. Existing remote
      // URLs (edit mode) pass through untouched.
      const supabase = createBrowserSupabase();
      const resolved: string[] = [];
      for (const img of form.images) {
        const file = pendingFilesRef.current.get(img);
        if (!file) {
          resolved.push(img);
          continue;
        }
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        resolved.push(data.publicUrl);
      }

      const basePayload = {
        name: form.name,
        type: form.type,
        gender: form.gender,
        price: form.price,
        originalPrice: form.originalPrice > 0 ? form.originalPrice : undefined,
        imageUrls: resolved,
        description: form.description,
        isNew: form.isNew,
        isActive: form.status === "active",
      };

      // Stock only flows through on create — it seeds one variant per
      // applicable size with this per-size quantity. On update, per-size
      // stock is owned by the dedicated stock editor and total_stock is
      // kept in sync by the migration 0013 trigger.
      const saved =
        mode === "create"
          ? await productsRepo.create({ ...basePayload, stock: form.stock })
          : await productsRepo.update(productId!, basePayload);

      // Successful write — revoke object URLs and forget the pending
      // files. (In edit mode, removed remote images are deleted from
      // storage by the repo's update().)
      for (const url of pendingFilesRef.current.keys()) {
        URL.revokeObjectURL(url);
      }
      pendingFilesRef.current.clear();

      if (mode === "create") {
        toast.success(t("admin.created"), saved.name);
        router.push("/admin/products");
      } else {
        toast.success(t("admin.saved"), saved.name);
        // Re-baseline against what we just persisted: form fields + the
        // resolved (post-upload) image URLs. Clears the dirty banner and
        // means a follow-up save won't re-upload the same files.
        const savedForm: AdminProductForm = { ...form, images: resolved };
        setForm(savedForm);
        setBaseline(savedForm);
        router.refresh();
      }
    } catch (err) {
      // Supabase errors come back as { code, message, details }. RLS
      // rejection reads "new row violates row-level security policy" —
      // expose it verbatim so the admin knows their account isn't admin.
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : mode === "create"
              ? "Failed to create product"
              : "Failed to save product";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  async function handleDelete() {
    if (!productId) return;
    if (!window.confirm(t("admin.confirmDelete"))) return;
    setDeleting(true);
    setSubmitError(null);
    try {
      await productsRepo.softDelete(productId);
      toast.success(t("admin.deleted"), initialProduct?.name ?? "");
      router.push("/admin/products");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to delete product";
      setSubmitError(message);
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    if (!productId) return;
    setDuplicating(true);
    setSubmitError(null);
    try {
      const created = await productsRepo.duplicate(productId);
      toast.success(t("admin.duplicated"), created.name);
      router.push(`/admin/products/${created.id}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to duplicate product";
      setSubmitError(message);
      setDuplicating(false);
    }
  }

  const imageCountLabel =
    form.images.length === 1
      ? t("admin.imageCount", { count: form.images.length })
      : t("admin.imageCountPlural", { count: form.images.length });

  const isCreate = mode === "create";
  const headingTitle = isCreate
    ? t("admin.createProductTitle")
    : form.name || initialProduct?.name || "";

  const submitLabel = submitting
    ? isCreate
      ? t("admin.creating")
      : t("admin.saving")
    : isCreate
    ? t("admin.create")
    : t("admin.save");

  // Submit is disabled when nothing's changed (edit) or required fields empty (create)
  const submitDisabled =
    submitting ||
    (isCreate ? !form.name.trim() || form.price <= 0 : !isDirty);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#0A0A0A] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("admin.products")}
          </Link>
          <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-[#0A0A0A] break-words">
            {headingTitle || t("admin.createProductTitle")}
          </h1>
          {isCreate ? (
            <p className="text-xs sm:text-sm text-[#737373] mt-1 max-w-xl">
              {t("admin.createProductSubtitle")}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-[#737373] mt-1">
              PEAK-{(productId ?? "").toUpperCase()}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isCreate && (
            <>
              <Link
                href={`/admin/products/${productId}/stock`}
                className="h-10 px-3 sm:px-4 inline-flex items-center gap-1.5 bg-white border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#404040] text-sm font-semibold rounded-lg transition-colors"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("admin.manageStock")}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={duplicating || deleting}
                className="h-10 px-3 sm:px-4 inline-flex items-center gap-1.5 bg-white border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#404040] text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {duplicating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {t("admin.duplicate")}
                </span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || duplicating}
                className="h-10 px-3 sm:px-4 inline-flex items-center gap-1.5 bg-white border border-red-200 text-[#DC2626] hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{t("admin.delete")}</span>
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={submitDisabled}
            className="h-10 px-4 sm:px-5 inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {submitLabel}
          </button>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-6">
        {/* LEFT */}
        <div className="space-y-6 min-w-0">
          {/* Media */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
                {t("admin.media")}
              </h2>
              {form.images.length > 0 && (
                <span className="text-xs text-[#737373]">
                  {imageCountLabel}
                </span>
              )}
            </div>

            {form.images.length === 0 ? (
              <div className="aspect-[16/9] sm:aspect-[3/1] rounded-xl border-2 border-dashed border-[#D4D4D4] bg-[#FAFAFA] flex items-center justify-center text-sm text-[#737373] text-center px-4 mb-4">
                {t("admin.noImages")}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
                {form.images.map((src, i) => (
                  <ImageTile
                    key={`${src}-${i}`}
                    src={src}
                    isPrimary={i === 0}
                    onSetPrimary={() => setPrimary(i)}
                    onRemove={() => removeImage(i)}
                    primaryLabel={t("admin.primary")}
                    setAsPrimaryLabel={t("admin.setAsPrimary")}
                    removeLabel={t("admin.removeImage")}
                  />
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-11 inline-flex items-center justify-center gap-2 bg-[#FAFAFA] border-2 border-dashed border-[#D4D4D4] text-[#525252] text-sm font-semibold rounded-lg hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
            >
              <Upload className="w-4 h-4" />
              {t("admin.uploadImage")}
            </button>
            <p className="mt-2 text-xs text-[#737373]">
              JPG, PNG or WebP — up to 5 MB each. The first image is the
              primary one shown on the product card. Files are only
              uploaded when you click <strong>Create</strong>.
            </p>
          </section>

          {/* General */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-6">
            <h2 className="font-heading text-lg font-bold text-[#0A0A0A] mb-5">
              {t("admin.generalInfo")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <Field label={t("admin.productName")} className="sm:col-span-2">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder={t("admin.productNamePlaceholder")}
                  required={isCreate}
                  className={inputCls}
                />
              </Field>

              <Field label={t("admin.categoryField")}>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="Running, Basketball…"
                  className={inputCls}
                />
              </Field>

              <Field label={t("admin.typeField")}>
                <select
                  value={form.type}
                  onChange={(e) =>
                    update("type", e.target.value as Product["type"])
                  }
                  className={inputCls}
                >
                  {TYPES.map((opt) => (
                    <option key={opt} value={opt} className="capitalize">
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("admin.genderField")}>
                <select
                  value={form.gender}
                  onChange={(e) =>
                    update("gender", e.target.value as Product["gender"])
                  }
                  className={inputCls}
                >
                  {GENDERS.map((opt) => (
                    <option key={opt} value={opt} className="capitalize">
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("admin.statusCol")}>
                <select
                  value={form.status}
                  onChange={(e) =>
                    update(
                      "status",
                      e.target.value as AdminProductForm["status"]
                    )
                  }
                  className={inputCls}
                >
                  <option value="active">{t("admin.activeBadge")}</option>
                  <option value="draft">{t("admin.draftBadge")}</option>
                </select>
              </Field>
            </div>

            <label className="flex items-center gap-2 mt-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => update("isNew", e.target.checked)}
                className="w-4 h-4 rounded border-[#D4D4D4] text-[#DC2626] focus:ring-[#DC2626]"
              />
              <span className="text-sm text-[#404040]">
                {t("admin.isNewLabel")}
              </span>
            </label>
          </section>

          {/* Pricing */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-6">
            <h2 className="font-heading text-lg font-bold text-[#0A0A0A] mb-5">
              {t("admin.pricing")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <Field label={t("admin.priceField")}>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => update("price", Number(e.target.value))}
                  required={isCreate}
                  className={inputCls}
                />
              </Field>
              <Field label={t("admin.originalPriceField")}>
                <input
                  type="number"
                  min={0}
                  value={form.originalPrice}
                  onChange={(e) =>
                    update("originalPrice", Number(e.target.value))
                  }
                  className={inputCls}
                />
              </Field>
              <Field label={t("admin.discountField")}>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={form.discount}
                  onChange={(e) => update("discount", Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          {/* Inventory */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-6">
            <h2 className="font-heading text-lg font-bold text-[#0A0A0A] mb-5">
              {t("admin.inventory")}
            </h2>
            <Field label={t("admin.stockField")}>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) =>
                  isCreate ? update("stock", Number(e.target.value)) : undefined
                }
                readOnly={!isCreate}
                disabled={!isCreate}
                aria-readonly={!isCreate}
                className={cn(
                  inputCls,
                  "max-w-xs",
                  !isCreate &&
                    "bg-[#FAFAFA] text-[#737373] cursor-not-allowed"
                )}
              />
            </Field>
            <div className="mt-3 text-xs text-[#737373]">
              {form.stock === 0
                ? t("admin.outOfStockBadge")
                : form.stock <= 3
                ? t("admin.lowStockBadge")
                : t("admin.inStockBadge")}
            </div>
            {isCreate ? (
              <p className="mt-2 text-xs text-[#737373]">
                {t("admin.stockSeedHint")}
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="text-xs text-[#737373]">
                  {t("admin.stockEditOnStockPage")}
                </p>
                <Link
                  href={`/admin/products/${productId}/stock`}
                  className="inline-flex items-center gap-1.5 h-9 px-3 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  {t("admin.manageStock")}
                </Link>
              </div>
            )}
          </section>

          {/* Description */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-6">
            <h2 className="font-heading text-lg font-bold text-[#0A0A0A] mb-5">
              {t("admin.description")}
            </h2>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder={t("admin.descriptionPlaceholder")}
              rows={6}
              className={cn(inputCls, "h-auto py-3 resize-none")}
            />
          </section>
        </div>

        {/* RIGHT */}
        <aside className="space-y-6 min-w-0">
          {/* Live preview */}
          <section className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#737373] mb-4">
              {t("admin.preview")}
            </h2>
            <div className="aspect-square rounded-xl overflow-hidden bg-[#F5F5F5] relative mb-4">
              {form.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.images[0]}
                  alt={form.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#A3A3A3] text-sm text-center px-4">
                  {t("admin.noImages")}
                </div>
              )}
              {form.discount > 0 && (
                <span className="absolute top-3 right-3 bg-[#DC2626] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow">
                  -{form.discount}%
                </span>
              )}
              {form.isNew && (
                <span className="absolute top-3 left-3 bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                  NEW
                </span>
              )}
            </div>
            <p className="text-[11px] uppercase tracking-widest text-[#737373] mb-1">
              {form.category || "—"}
            </p>
            <p className="text-sm font-semibold text-[#0A0A0A] mb-2 line-clamp-2">
              {form.name || "—"}
            </p>
            <div className="flex items-baseline gap-2">
              {form.originalPrice > 0 && form.originalPrice !== form.price && (
                <span className="text-xs text-[#A3A3A3] line-through">
                  {form.originalPrice.toLocaleString("fr-DZ")} DZD
                </span>
              )}
              <span className="text-base font-bold text-[#DC2626]">
                {form.price.toLocaleString("fr-DZ")} DZD
              </span>
            </div>
          </section>

          {/* Dirty banner (edit-only — create has nothing to compare to) */}
          {!isCreate && isDirty && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-sm text-amber-900 mb-3">
                {t("admin.unsavedChanges")}
              </p>
              <button
                type="button"
                onClick={() => setForm(baseline)}
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 bg-white border border-amber-300 text-amber-900 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
                {t("admin.discard")}
              </button>
            </section>
          )}
        </aside>
      </div>
    </form>
  );
}

function ImageTile({
  src,
  isPrimary,
  onSetPrimary,
  onRemove,
  primaryLabel,
  setAsPrimaryLabel,
  removeLabel,
}: {
  src: string;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
  primaryLabel: string;
  setAsPrimaryLabel: string;
  removeLabel: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden bg-[#F5F5F5] border-2 transition-colors",
        isPrimary
          ? "border-[#DC2626]"
          : "border-[#E5E5E5] hover:border-[#0A0A0A]"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {isPrimary && (
        <span className="absolute top-1.5 left-1.5 bg-[#DC2626] text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow flex items-center gap-1 pointer-events-none">
          <Check className="w-2.5 h-2.5" />
          {primaryLabel}
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/95 text-[#DC2626] hover:bg-[#DC2626] hover:text-white flex items-center justify-center shadow transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {!isPrimary && (
        <button
          type="button"
          onClick={onSetPrimary}
          aria-label={setAsPrimaryLabel}
          title={setAsPrimaryLabel}
          className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-white/95 text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white flex items-center justify-center shadow transition-colors"
        >
          <Star className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#737373] mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
