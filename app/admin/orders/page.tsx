"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Search, Trash2 } from "lucide-react";
import { type OrderRecord, type OrderStatus } from "@/lib/orders";
import { ordersRepo } from "@/lib/repository";
import { formatPrice } from "@/lib/mockdata";
import { useTranslations, useLocale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination, {
  PAGE_SIZE_OPTIONS,
  type PageSize,
} from "@/components/admin/Pagination";
import BulkBar from "@/components/admin/BulkBar";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Unexpected error";
}

function statusLabel(status: OrderStatus, t: (k: string) => string) {
  switch (status) {
    case "pending":
      return t("admin.statusPending");
    case "confirmed":
      return t("admin.statusConfirmed");
    case "shipped":
      return t("admin.statusShipped");
    case "delivered":
      return t("admin.statusDelivered");
    case "cancelled":
      return t("admin.statusCancelled");
  }
}

export default function AdminOrdersPage() {
  const t = useTranslations();
  const toast = useToast();
  const { locale } = useLocale();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(
    PAGE_SIZE_OPTIONS[0]
  );
  const [hydrated, setHydrated] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoadError(null);
      const rows = await ordersRepo.list();
      setOrders(rows);
    } catch (err) {
      const message = getErrorMessage(err);
      setLoadError(message);
      toast.error(t("admin.ordersTitle"), message);
    }
  }

  useEffect(() => {
    let cancelled = false;
    ordersRepo
      .list()
      .then((rows) => {
        if (cancelled) return;
        setLoadError(null);
        setOrders(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = getErrorMessage(err);
        setLoadError(message);
        toast.error(t("admin.ordersTitle"), message);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [t, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.phone.includes(q)
    );
  }, [orders, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const allPageSelected =
    pageItems.length > 0 && pageItems.every((o) => selected.has(o.id));
  const somePageSelected = pageItems.some((o) => selected.has(o.id));

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
        pageItems.forEach((o) => next.delete(o.id));
      } else {
        pageItems.forEach((o) => next.add(o.id));
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0 || loadingAction) return;
    if (!window.confirm(t("admin.confirmBulkDelete", { count: ids.length })))
      return;
    setLoadingAction(true);
    try {
      const removed = await ordersRepo.deleteMany(ids);
      await refresh();
      setSelected(new Set());
      toast.success(t("admin.bulkDeleted", { count: removed }));
    } catch (err) {
      toast.error(t("admin.bulkDelete"), getErrorMessage(err));
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleBulkStatus(status: OrderStatus) {
    const ids = Array.from(selected);
    if (ids.length === 0 || loadingAction) return;
    setLoadingAction(true);
    try {
      const count = await ordersRepo.updateManyStatus(ids, status);
      await refresh();
      setSelected(new Set());
      toast.success(t("admin.bulkStatusChanged", { count }));
    } catch (err) {
      toast.error(t("admin.bulkChangeStatus"), getErrorMessage(err));
    } finally {
      setLoadingAction(false);
    }
  }

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-DZ" : locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-1">
          {t("admin.ordersTitle")}
        </h1>
        <p className="text-sm text-[#525252]">{t("admin.ordersSubtitle")}</p>
      </div>

      {/* Bulk bar */}
      <BulkBar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <select
          disabled={loadingAction}
          onChange={(e) => {
            if (e.target.value) {
              handleBulkStatus(e.target.value as OrderStatus);
              e.target.value = "";
            }
          }}
          defaultValue=""
          className="h-8 px-2 rounded-md bg-white text-[#0A0A0A] text-xs font-medium focus:outline-none disabled:opacity-60 disabled:cursor-wait"
        >
          <option value="" disabled>
            {t("admin.bulkChangeStatus")}
          </option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s, t)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleBulkDelete}
          disabled={loadingAction}
          className="h-8 px-3 inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-wait disabled:hover:bg-[#DC2626]"
        >
          <Trash2 className="w-3.5 h-3.5" />
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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={t("admin.searchOrders")}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
          />
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#B91C1C]">
          {loadError}
        </div>
      )}

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
                  {t("admin.orderCol")}
                </th>
                <th className="px-5 py-4 font-semibold">
                  {t("admin.customerCol")}
                </th>
                <th className="px-5 py-4 font-semibold">
                  {t("admin.itemsCol")}
                </th>
                <th className="px-5 py-4 font-semibold">
                  {t("admin.totalCol")}
                </th>
                <th className="px-5 py-4 font-semibold">
                  {t("admin.dateCol")}
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
              {hydrated && pageItems.length > 0 ? (
                pageItems.map((o) => {
                  const itemCount = o.items.reduce(
                    (sum, it) => sum + it.quantity,
                    0
                  );
                  const isSelected = selected.has(o.id);
                  return (
                    <tr
                      key={o.id}
                      className={cn(
                        "transition-colors",
                        isSelected ? "bg-[#FEF2F2]" : "hover:bg-[#FAFAFA]"
                      )}
                    >
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(o.id)}
                          aria-label={`Select ${o.id}`}
                          className="border-[#D4D4D4] data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:border-[#0A0A0A]"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-[#0A0A0A] font-semibold hover:text-[#DC2626] transition-colors"
                        >
                          {o.id}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[#0A0A0A] font-medium">
                          {o.customer.fullName}
                        </p>
                        <p className="text-xs text-[#737373]">
                          {o.customer.phone}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-[#404040]">{itemCount}</td>
                      <td className="px-5 py-4 font-bold text-[#DC2626] whitespace-nowrap">
                        {formatPrice(o.subtotal)}
                      </td>
                      <td className="px-5 py-4 text-[#525252]">
                        {dateFmt(o.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                            STATUS_STYLES[o.status]
                          )}
                        >
                          {statusLabel(o.status, t)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#525252] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-colors"
                          aria-label={t("admin.orderDetailTitle")}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-[#737373]"
                  >
                    {hydrated ? t("admin.noOrders") : t("common.loading")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
