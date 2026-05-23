"use client";

import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "@/lib/i18n";
import type { Product } from "@/lib/mockdata";

export interface FiltersState {
  categories: string[];
  genders: string[];
  types: string[];
  sizes: string[];
  priceRange: [number, number];
}

export const emptyFilters: FiltersState = {
  categories: [],
  genders: [],
  types: [],
  sizes: [],
  priceRange: [0, 25000],
};

// Map UI category id → underlying Product["type"] values
export const CATEGORY_TYPES: Record<string, Product["type"][]> = {
  shoes: ["running", "basketball", "casual", "training"],
  clothing: ["apparel"],
  accessories: [],
};

interface FiltersSidebarProps {
  filters: FiltersState;
  onChange: (next: FiltersState) => void;
  isMobileOpen: boolean;
  onClose: () => void;
}

const sizes = ["38", "39", "40", "41", "42", "43", "44"];

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { id: string; label: string; count?: number }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="pb-8 mb-8 border-b border-[#E5E5E5]">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#0A0A0A] mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <Checkbox
              id={option.id}
              checked={selected.includes(option.id)}
              onCheckedChange={() => onToggle(option.id)}
              className="border-[#D4D4D4] data-[state=checked]:bg-[#DC2626] data-[state=checked]:border-[#DC2626]"
            />
            <span className="text-sm text-[#404040] group-hover:text-[#0A0A0A] transition-colors flex-1">
              {option.label}
            </span>
            {option.count !== undefined && (
              <span className="text-[13px] text-[#737373]">({option.count})</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FiltersSidebar({
  filters,
  onChange,
  isMobileOpen,
  onClose,
}: FiltersSidebarProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const categories = [
    { id: "shoes", label: t("filters.shoes"), count: 48 },
    { id: "clothing", label: t("filters.clothing"), count: 32 },
    { id: "accessories", label: t("filters.accessories"), count: 15 },
  ];

  const genders = [
    { id: "men", label: t("filters.men"), count: 52 },
    { id: "women", label: t("filters.women"), count: 28 },
    { id: "kids", label: t("filters.kids"), count: 15 },
  ];

  const types = [
    { id: "running", label: t("filters.running"), count: 18 },
    { id: "basketball", label: t("filters.basketball"), count: 12 },
    { id: "casual", label: t("filters.casual"), count: 24 },
    { id: "training", label: t("filters.training"), count: 16 },
  ];

  function toggleItem(key: keyof Omit<FiltersState, "priceRange">, id: string) {
    const current = filters[key];
    const next = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    onChange({ ...filters, [key]: next });
  }

  function setPriceRange(value: [number, number]) {
    onChange({ ...filters, priceRange: value });
  }

  function clearAll() {
    onChange(emptyFilters);
  }

  const fmt = (n: number) => n.toLocaleString(locale === "ar" ? "ar-DZ" : locale);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "lg:sticky lg:top-[100px] lg:h-fit",
          "fixed inset-y-0 left-0 w-full max-w-[320px] bg-white z-50 overflow-y-auto p-6 transition-transform duration-300 lg:relative lg:inset-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:p-0 lg:transition-none lg:bg-transparent",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden text-[#0A0A0A]"
          aria-label={t("common.close")}
        >
          <X className="w-7 h-7" />
        </button>

        <div className="pt-10 lg:pt-0">
          <FilterGroup
            title={t("filters.category")}
            options={categories}
            selected={filters.categories}
            onToggle={(id) => toggleItem("categories", id)}
          />

          <FilterGroup
            title={t("filters.gender")}
            options={genders}
            selected={filters.genders}
            onToggle={(id) => toggleItem("genders", id)}
          />

          <FilterGroup
            title={t("filters.type")}
            options={types}
            selected={filters.types}
            onToggle={(id) => toggleItem("types", id)}
          />

          {/* Price Range */}
          <div className="pb-8 mb-8 border-b border-[#E5E5E5]">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#0A0A0A] mb-4">
              {t("filters.priceRange")}
            </h3>
            <Slider
              min={0}
              max={25000}
              step={500}
              value={filters.priceRange}
              onValueChange={(value) =>
                setPriceRange(value as [number, number])
              }
              className="mb-4 [&_[data-slot=slider-thumb]]:bg-[#DC2626] [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-range]]:bg-[#DC2626]"
            />
            <div className="text-center text-sm font-semibold text-[#404040]">
              {fmt(filters.priceRange[0])} DZD — {fmt(filters.priceRange[1])} DZD
            </div>
          </div>

          {/* Size */}
          <div className="pb-8 mb-8 border-b border-[#E5E5E5]">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#0A0A0A] mb-4">
              {t("filters.size")}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleItem("sizes", size)}
                  className={cn(
                    "py-2 text-sm font-medium rounded-lg border transition-all duration-200",
                    filters.sizes.includes(size)
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "border-[#E5E5E5] text-[#404040] hover:border-[#0A0A0A]"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#0A0A0A] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#262626] transition-colors duration-200 mb-3 lg:hidden"
          >
            {t("filters.apply")}
          </button>
          <button
            onClick={clearAll}
            className="w-full border border-[#D4D4D4] text-[#404040] py-2.5 rounded-lg font-medium text-sm hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-all duration-200"
          >
            {t("filters.clearAll")}
          </button>
        </div>
      </aside>
    </>
  );
}
