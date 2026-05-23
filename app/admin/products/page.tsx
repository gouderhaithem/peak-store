"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/mockdata";
import { productsRepo } from "@/lib/repository";
import type { AdminProductRow } from "@/lib/repository/products";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination, {
  PAGE_SIZE_OPTIONS,
  type PageSize,
} from "@/components/admin/Pagination";
import BulkBar from "@/components/admin/BulkBar";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const t = useTranslations();
  const toast = useToast();
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZE_OPTIONS[0]);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce the search input so we aren't hitting Supabase on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Reset to page 1 whenever the search term changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  // Fetch a page of products from Supabase whenever page / pageSize / query changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productsRepo
      .listAdmin({ page, pageSize, query: debouncedQuery })
      .then((result) => {
        if (cancelled) return;
        setRows(result.rows);
        setTotal(result.total);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load admin products", err);
        toast.error("Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // toast is fresh every render (its provider doesn't memoize) — listing
    // it here would refetch on every keystroke. The other deps are the real
    // inputs to the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedQuery]);

  const allPageSelected =
    rows.length > 0 && rows.every((p) => selected.has(p.id));
  const somePageSelected = rows.some((p) => selected.has(p.id));

  function toggleOne(id: string) {
    setSelected((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((curr) => {
      const next = new Set(curr);
      if (allPageSelected) {
        rows.forEach((p) => next.delete(p.id));
      } else {
        rows.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function refresh() {
    setLoading(true);
    try {
      const result = await productsRepo.listAdmin({ page, pageSize, query: debouncedQuery });
      setRows(result.rows);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("admin.confirmDeleteOne"))) return;
    setActionLoading(true);
    try {
      await productsRepo.softDelete(id);
      setRows((r) => r.filter((p) => p.id !== id));
      setTotal((n) => n - 1);
      setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
      toast.success(t("admin.delete"), t("admin.deleteSuccess"));
    } catch (err) {
      toast.error(t("admin.delete"), err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0 || actionLoading) return;
    if (!window.confirm(t("admin.confirmBulkDelete", { count: ids.length }))) return;
    setActionLoading(true);
    try {
      await productsRepo.softDeleteMany(ids);
      await refresh();
      setSelected(new Set());
      toast.success(t("admin.bulkDelete"), t("admin.bulkDeleted", { count: ids.length }));
    } catch (err) {
      toast.error(t("admin.bulkDelete"), err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkStatus(status: "active" | "draft") {
    const ids = Array.from(selected);
    if (ids.length === 0 || actionLoading) return;
    setActionLoading(true);
    try {
      await productsRepo.setManyActive(ids, status === "active");
      await refresh();
      setSelected(new Set());
      toast.success(t("admin.bulkChangeStatus"), t("admin.bulkStatusChanged", { count: ids.length }));
    } catch (err) {
      toast.error(t("admin.bulkChangeStatus"), err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }

  function stockBadge(stock: number) {
    if (stock === 0) {
      return {
        label: t("admin.outOfStockBadge"),
        cls: "bg-red-100 text-red-700 border-red-200",
      };
    }
    if (stock <= 3) {
      return {
        label: t("admin.lowStockBadge"),
        cls: "bg-amber-100 text-amber-800 border-amber-200",
      };
    }
    return {
      label: t("admin.inStockBadge"),
      cls: "bg-green-100 text-green-700 border-green-200",
    };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-1">
            {t("admin.productsTitle")}
          </h1>
          <p className="text-sm text-[#525252]">
            {t("admin.productsSubtitle")}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="h-11 px-5 inline-flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("admin.addProduct")}
        </Link>
      </div>

      {/* Bulk bar */}
      <BulkBar selectedCount={selected.size} onClear={clearSelection}>
        <select
          disabled={actionLoading}
          onChange={(e) => {
            if (e.target.value) {
              handleBulkStatus(e.target.value as "active" | "draft");
              e.target.value = "";
            }
          }}
          defaultValue=""
          className="h-8 px-2 rounded-md bg-white text-[#0A0A0A] text-xs font-medium focus:outline-none disabled:opacity-60 disabled:cursor-wait"
        >
          <option value="" disabled>
            {t("admin.bulkChangeStatus")}
          </option>
          <option value="active">{t("admin.activeBadge")}</option>
          <option value="draft">{t("admin.draftBadge")}</option>
        </select>
        <button
          type="button"
          onClick={handleBulkDelete}
          disabled={actionLoading}
          className="h-8 px-3 inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-wait disabled:hover:bg-[#DC2626]"
        >
          {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {t("admin.bulkDelete")}
        </button>
      </BulkBar>

      {/* Toolbar */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.searchProducts")}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
          />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[#737373] bg-[#FAFAFA] border border-[#E5E5E5] rounded-full px-3 py-1 whitespace-nowrap">
          {loading ? "Loading…" : `${total} total`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-[#FAFAFA] text-[#525252] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 w-10">
                  <Checkbox
                    checked={allPageSelected}
                    indeterminate={!allPageSelected && somePageSelected}
                    onCheckedChange={toggleAllOnPage}
                    aria-label={t("admin.selectAll")}
                    className="border-[#D4D4D4] data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:border-[#0A0A0A]"
                  />
                </th>
                <th className="px-5 py-4 font-semibold">
                  {t("admin.productCol")}
                </th>
                <th className="px-5 py-4 font-semibold">{t("admin.typeCol")}</th>
                <th className="px-5 py-4 font-semibold">
                  {t("admin.priceCol")}
                </th>
                <th className="px-5 py-4 font-semibold">
                  {t("admin.stockCol")}
                </th>
                <th className="px-5 py-4 font-semibold">
                  {t("admin.statusCol")}
                </th>
                <th className="px-5 py-4 font-semibold text-right">
                  {t("admin.actionsCol")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {rows.map((p) => {
                const badge = stockBadge(p.stock);
                const isSelected = selected.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "transition-colors",
                      isSelected ? "bg-[#FEF2F2]" : "hover:bg-[#FAFAFA]"
                    )}
                  >
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(p.id)}
                        aria-label={`Select ${p.name}`}
                        className="border-[#D4D4D4] data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:border-[#0A0A0A]"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-3 group/row"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F5F5] relative shrink-0">
                          {p.image && (
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0A0A0A] truncate max-w-[220px] group-hover/row:text-[#DC2626] transition-colors">
                            {p.name}
                          </p>
                          {/* <p className="text-xs text-[#737373]">
                            PEAK-{p.id.toUpperCase()}
                          </p> */}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-[#404040] capitalize">
                      {p.type}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#DC2626] whitespace-nowrap">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0A0A0A]">
                          {p.stock}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                            badge.cls
                          )}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full",
                          p.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-[#F5F5F5] text-[#525252]"
                        )}
                      >
                        {p.isActive
                          ? t("admin.activeBadge")
                          : t("admin.draftBadge")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/${p.id}`}
                          aria-label={t("admin.edit")}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#525252] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={actionLoading}
                          aria-label={t("admin.delete")}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#525252] hover:bg-red-50 hover:text-[#DC2626] transition-colors disabled:opacity-40 disabled:cursor-wait"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-[#737373]"
                  >
                    {loading ? "Loading…" : t("shop.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
