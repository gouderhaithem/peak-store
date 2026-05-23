"use client";

import { X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

interface BulkBarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;
}

export default function BulkBar({
  selectedCount,
  onClear,
  children,
}: BulkBarProps) {
  const t = useTranslations();

  if (selectedCount === 0) return null;

  const label =
    selectedCount === 1
      ? t("admin.selected")
      : t("admin.selectedPlural");

  return (
    <div className="bg-[#0A0A0A] text-white rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onClear}
        aria-label={t("admin.deselectAll")}
        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <span className="text-sm font-semibold">
        {selectedCount} {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 ms-auto">{children}</div>
    </div>
  );
}
