"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface PaginationProps {
  page: number;
  pageSize: PageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  const fmt = (n: number) =>
    n.toLocaleString(locale === "ar" ? "ar-DZ" : locale);

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA]">
      <div className="flex items-center justify-between sm:justify-start gap-3 text-xs text-[#525252]">
        <span>
          {t("admin.showingRange", {
            from: fmt(from),
            to: fmt(to),
            total: fmt(total),
          })}
        </span>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3">
        <label className="flex items-center gap-2 text-xs text-[#525252]">
          <span className="hidden sm:inline">{t("admin.rowsPerPage")}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value) as PageSize);
              onPageChange(1);
            }}
            className="h-8 px-2 rounded-md border border-[#E5E5E5] bg-white text-xs font-medium focus:outline-none focus:border-[#0A0A0A]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label={t("admin.prevPage")}
            className={cn(
              "w-8 h-8 rounded-md border border-[#E5E5E5] bg-white flex items-center justify-center text-[#404040] hover:bg-[#F5F5F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
              "rtl:rotate-180"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-[#404040] px-2 whitespace-nowrap">
            {t("admin.pageOf", { page: fmt(safePage), total: fmt(totalPages) })}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label={t("admin.nextPage")}
            className={cn(
              "w-8 h-8 rounded-md border border-[#E5E5E5] bg-white flex items-center justify-center text-[#404040] hover:bg-[#F5F5F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
              "rtl:rotate-180"
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
