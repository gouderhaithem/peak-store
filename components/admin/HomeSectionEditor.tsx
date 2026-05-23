"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { homeContentRepo } from "@/lib/repository/homeContent";
import type {
  HomeSection,
  LocalizedText,
  UpdateHomeSectionInput,
} from "@/lib/repository/homeContent";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 30_000;
const UPDATE_TIMEOUT_MS = 15_000;

// Promise.race wrapper so a hung network call can't leave the form
// permanently stuck in "Saving…". Returns a rejection with a clear
// message after `ms` if the inner promise hasn't settled.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms
    );
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Supabase / fetch errors come in lots of shapes. Pull the most useful
// human-readable string we can find.
function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const maybe = err as { message?: unknown; error?: unknown };
    if (typeof maybe.message === "string") return maybe.message;
    if (typeof maybe.error === "string") return maybe.error;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

interface Props {
  section: HomeSection;
  onSaved: (next: HomeSection) => void;
}

interface FormState {
  title: LocalizedText;
  accent: LocalizedText;
  description: LocalizedText;
  ctaLabel: LocalizedText;
  ctaHref: string;
  imageUrl: string | null;
  isActive: boolean;
}

const emptyLocalized: LocalizedText = { fr: "", en: "", ar: "" };

function buildFormFromSection(section: HomeSection): FormState {
  return {
    title: section.title,
    accent: section.accent ?? emptyLocalized,
    description: section.description ?? emptyLocalized,
    ctaLabel: section.ctaLabel ?? emptyLocalized,
    ctaHref: section.ctaHref,
    imageUrl: section.imageUrl,
    isActive: section.isActive,
  };
}

function hasAnyValue(text: LocalizedText): boolean {
  return Boolean(text.fr.trim() || text.en.trim() || text.ar.trim());
}

export default function HomeSectionEditor({ section, onSaved }: Props) {
  const t = useTranslations();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() =>
    buildFormFromSection(section)
  );
  const [submitting, setSubmitting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Pending file blob — only uploaded to storage on save, so cancelling
  // the form never leaves orphans in the bucket.
  const pendingFileRef = useRef<File | null>(null);

  function patchLocalized(
    key: "title" | "accent" | "description" | "ctaLabel",
    locale: keyof LocalizedText,
    value: string
  ) {
    setForm((curr) => ({
      ...curr,
      [key]: { ...curr[key], [locale]: value },
    }));
  }

  function handleFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith("image/")) {
      toast.error(
        t("admin.uploadFailed"),
        t("admin.fileNotImage", { name: file.name })
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        t("admin.uploadFailed"),
        t("admin.fileTooLarge", { name: file.name })
      );
      return;
    }
    // Revoke previous preview blob (if any) before swapping.
    if (form.imageUrl && form.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.imageUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    pendingFileRef.current = file;
    setForm((curr) => ({ ...curr, imageUrl: previewUrl }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleToggleVisibility() {
    const next = !form.isActive;
    setTogglingVisibility(true);
    try {
      const payload: UpdateHomeSectionInput = {
        title: form.title,
        accent: hasAnyValue(form.accent) ? form.accent : null,
        description: hasAnyValue(form.description) ? form.description : null,
        ctaLabel: hasAnyValue(form.ctaLabel) ? form.ctaLabel : null,
        ctaHref: form.ctaHref.trim() || "/shop",
        imageUrl: form.imageUrl,
        isActive: next,
      };
      const saved = await withTimeout(
        homeContentRepo.update(section.slug, payload),
        UPDATE_TIMEOUT_MS,
        "Visibility toggle"
      );
      setForm(buildFormFromSection(saved));
      onSaved(saved);
      toast.success(
        next ? t("admin.homeVisible") : t("admin.homeHidden"),
        t(`admin.homeSection.${section.slug}`)
      );
    } catch (err) {
      toast.error(t("admin.saveFailed"), extractMessage(err));
    } finally {
      setTogglingVisibility(false);
    }
  }

  function clearImage() {
    if (form.imageUrl && form.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.imageUrl);
    }
    pendingFileRef.current = null;
    setForm((curr) => ({ ...curr, imageUrl: null }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasAnyValue(form.title)) {
      toast.error(t("admin.saveFailed"), t("admin.homeTitleRequired"));
      return;
    }
    setSubmitting(true);
    try {
      let resolvedImageUrl = form.imageUrl;

      // Upload the pending file if one is queued. Wrap in a timeout so a
      // silent network hang doesn't leave the form stuck forever.
      const pending = pendingFileRef.current;
      if (pending) {
        const supabase = createBrowserSupabase();
        const ext = (pending.name.split(".").pop() || "jpg").toLowerCase();
        const path = `home/${section.slug}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error: upErr } = await withTimeout(
          supabase.storage.from("product-images").upload(path, pending, {
            contentType: pending.type,
            upsert: false,
          }),
          UPLOAD_TIMEOUT_MS,
          "Image upload"
        );
        if (upErr) throw upErr;
        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        resolvedImageUrl = data.publicUrl;
      }

      const payload: UpdateHomeSectionInput = {
        title: form.title,
        accent: hasAnyValue(form.accent) ? form.accent : null,
        description: hasAnyValue(form.description) ? form.description : null,
        ctaLabel: hasAnyValue(form.ctaLabel) ? form.ctaLabel : null,
        ctaHref: form.ctaHref.trim() || "/shop",
        imageUrl: resolvedImageUrl,
        isActive: form.isActive,
      };

      const saved = await withTimeout(
        homeContentRepo.update(section.slug, payload),
        UPDATE_TIMEOUT_MS,
        "Save"
      );
      pendingFileRef.current = null;
      // Revoke any preview URL we held now that the real one is back.
      if (form.imageUrl && form.imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(form.imageUrl);
      }
      setForm(buildFormFromSection(saved));
      onSaved(saved);
      toast.success(t("admin.saved"), t(`admin.homeSection.${section.slug}`));
    } catch (err) {
      const message = extractMessage(err);
      // Surface the raw error to the console so it's debuggable even when
      // the toast description gets truncated.
      console.error(`[home-content/${section.slug}] save failed`, err);
      toast.error(t("admin.saveFailed"), message);
    } finally {
      setSubmitting(false);
    }
  }

  const isHero = section.kind === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#E5E5E5] rounded-2xl p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-[#E5E5E5]">
        <div>
          <h2 className="font-heading text-xl font-bold text-[#0A0A0A]">
            {t(`admin.homeSection.${section.slug}`)}
          </h2>
          <p className="text-sm text-[#737373] mt-1">
            {t(`admin.homeSection.${section.slug}Desc`)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleVisibility}
          disabled={togglingVisibility || submitting}
          className={cn(
            "inline-flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-60 disabled:cursor-wait",
            form.isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-[#E5E5E5] bg-[#F5F5F5] text-[#737373] hover:bg-[#EFEFEF]"
          )}
        >
          {togglingVisibility ? (
            <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
          ) : form.isActive ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
          {form.isActive ? t("admin.homeVisible") : t("admin.homeHidden")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
        {/* Text columns */}
        <div className="space-y-6 min-w-0">
          <LocalizedField
            label={t("admin.homeTitle")}
            required
            value={form.title}
            onChange={(loc, v) => patchLocalized("title", loc, v)}
          />

          {isHero && (
            <LocalizedField
              label={t("admin.homeAccent")}
              hint={t("admin.homeAccentHint")}
              value={form.accent}
              onChange={(loc, v) => patchLocalized("accent", loc, v)}
            />
          )}

          <LocalizedField
            label={t("admin.homeDescription")}
            value={form.description}
            multiline
            onChange={(loc, v) => patchLocalized("description", loc, v)}
          />

          <LocalizedField
            label={t("admin.homeCtaLabel")}
            value={form.ctaLabel}
            onChange={(loc, v) => patchLocalized("ctaLabel", loc, v)}
          />

          <div>
            <label className="block text-sm font-semibold text-[#404040] mb-2">
              {t("admin.homeCtaHref")}
            </label>
            <input
              type="text"
              value={form.ctaHref}
              onChange={(e) =>
                setForm((curr) => ({ ...curr, ctaHref: e.target.value }))
              }
              placeholder="/shop"
              className="w-full h-11 px-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10"
            />
          </div>
        </div>

        {/* Image */}
        <div className="lg:w-72">
          <label className="block text-sm font-semibold text-[#404040] mb-2">
            {t("admin.homeImage")}
          </label>
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#F5F5F5] border border-dashed border-[#E5E5E5]">
            {form.imageUrl ? (
              <>
                <Image
                  src={form.imageUrl}
                  alt={form.title.fr || section.slug}
                  fill
                  sizes="288px"
                  className="object-cover"
                  unoptimized={form.imageUrl.startsWith("blob:")}
                />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label={t("admin.removeImage")}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 text-[#525252] hover:text-[#DC2626] flex items-center justify-center shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#A3A3A3] text-sm gap-2 px-4 text-center">
                <Upload className="w-6 h-6" />
                <span>{t("admin.homeImageEmpty")}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] bg-white text-sm font-semibold text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
          >
            <Upload className="w-4 h-4" />
            {form.imageUrl ? t("admin.replaceImage") : t("admin.uploadImage")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files)}
          />
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 h-11 px-6 bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? t("admin.saving") : t("admin.save")}
        </button>
      </div>
    </form>
  );
}

interface LocalizedFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
  value: LocalizedText;
  onChange: (locale: keyof LocalizedText, value: string) => void;
}

function LocalizedField({
  label,
  hint,
  required,
  multiline,
  value,
  onChange,
}: LocalizedFieldProps) {
  const locales: Array<{ key: keyof LocalizedText; label: string; dir: "ltr" | "rtl" }> = [
    { key: "fr", label: "FR", dir: "ltr" },
    { key: "en", label: "EN", dir: "ltr" },
    { key: "ar", label: "AR", dir: "rtl" },
  ];
  return (
    <div>
      <label className="block text-sm font-semibold text-[#404040] mb-2">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-[#737373] mb-2">{hint}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {locales.map(({ key, label: locLabel, dir }) => (
          <div key={key} className="relative">
            <span className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] pointer-events-none">
              {locLabel}
            </span>
            {multiline ? (
              <textarea
                dir={dir}
                rows={3}
                value={value[key]}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full pt-7 pb-3 px-3 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] text-sm focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 resize-none"
              />
            ) : (
              <input
                type="text"
                dir={dir}
                value={value[key]}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full h-12 pt-5 pb-1 px-3 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] text-sm focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
