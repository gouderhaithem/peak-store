"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { AdminProductRow } from "@/lib/repository/products";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LowStockTableProps {
  products: AdminProductRow[];
}

export default function LowStockTable({ products }: LowStockTableProps) {
  const t = useTranslations();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-500" />
        <p className="text-sm text-[#737373]">{t("admin.noLowStock")}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#E5E5E5]">
      {products.map((p) => (
        <li key={p.id} className="px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-[#F5F5F5] relative">
            {p.image && (
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="36px"
                className="object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0A0A0A] truncate">
              {p.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full tabular-nums",
                p.stock === 0
                  ? "bg-[#FEE2E2] text-[#DC2626]"
                  : "bg-[#FEF9C3] text-[#92400E]"
              )}
            >
              {p.stock}
            </span>
            <Link
              href={`/admin/products/${p.id}/stock`}
              className="text-xs font-semibold text-[#737373] hover:text-[#DC2626] transition-colors"
            >
              {t("admin.manageStock")}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
