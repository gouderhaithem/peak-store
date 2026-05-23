"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, Trash2, Undo2 } from "lucide-react";
import { type Product } from "@/lib/mockdata";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { productsRepo } from "@/lib/repository";
import type {
  ProductColor,
  ProductVariant,
} from "@/lib/repository/products";
import { getSizeOptions } from "@/lib/products";

interface Row {
  id?: string;
  size: string | null;
  colorId: string | null;
  color: ProductColor | null;
  stock: number;
}

interface StockEditorProps {
  product: Product;
  initialVariants: ProductVariant[];
}

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition";

function variantsToRows(variants: ProductVariant[]): Row[] {
  return variants.map((v) => ({
    id: v.id,
    size: v.size,
    colorId: v.colorId,
    color: v.color,
    stock: v.stock,
  }));
}

function sig(size: string | null, colorId: string | null) {
  return `${size ?? ""}|${colorId ?? ""}`;
}

function colorName(color: ProductColor | null): string {
  return color?.nameFr ?? "";
}

function Swatch({ color }: { color: ProductColor }) {
  return (
    <span
      className="inline-flex h-5 w-5 overflow-hidden rounded-full border border-[#D4D4D4]"
      title={color.nameFr}
    >
      <span
        className="block h-full flex-1"
        style={{ backgroundColor: color.hex }}
      />
      {color.hexSecondary && (
        <span
          className="block h-full flex-1"
          style={{ backgroundColor: color.hexSecondary }}
        />
      )}
    </span>
  );
}

export default function StockEditor({
  product,
  initialVariants,
}: StockEditorProps) {
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();

  const allSizes = useMemo(
    () => getSizeOptions(product.type, product.gender),
    [product.type, product.gender]
  );

  const initial = useMemo(() => variantsToRows(initialVariants), [
    initialVariants,
  ]);
  const [baseline, setBaseline] = useState<Row[]>(initial);
  const [rows, setRows] = useState<Row[]>(initial);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedSize, setPickedSize] = useState<string>("");
  const [pickedColorId, setPickedColorId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    productsRepo.listColors().then((loaded) => {
      if (!cancelled) setColors(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(baseline),
    [rows, baseline]
  );

  const totalStock = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + (Number.isFinite(r.stock) ? r.stock : 0),
        0
      ),
    [rows]
  );

  const existingSigs = useMemo(
    () => new Set(rows.map((r) => sig(r.size, r.colorId))),
    [rows]
  );
  const pickedSizeValue = allSizes.length > 0 ? pickedSize || null : null;
  const pickedColor = colors.find((c) => c.id === pickedColorId) ?? null;
  const pickedColorValue = pickedColorId || null;
  const canAdd =
    (allSizes.length === 0 || Boolean(pickedSize)) &&
    (Boolean(pickedSizeValue) || Boolean(pickedColorValue)) &&
    !existingSigs.has(sig(pickedSizeValue, pickedColorValue));

  function updateStock(index: number, value: number) {
    setRows((curr) =>
      curr.map((row, i) =>
        i === index ? { ...row, stock: Math.max(0, Math.floor(value)) } : row
      )
    );
  }

  function removeRow(index: number) {
    setRows((curr) => curr.filter((_, i) => i !== index));
  }

  function addRow() {
    if (!canAdd) return;
    setRows((curr) => [
      ...curr,
      {
        size: pickedSizeValue,
        colorId: pickedColorValue,
        color: pickedColor,
        stock: 0,
      },
    ]);
    setPickedColorId("");
    if (allSizes.length > 0) setPickedSize("");
  }

  function statusLabel(stock: number): string {
    if (stock === 0) return t("admin.outOfStockBadge");
    if (stock <= 3) return t("admin.lowStockBadge");
    return t("admin.inStockBadge");
  }

  function statusColor(stock: number): string {
    if (stock === 0) return "bg-red-50 text-red-700 border-red-200";
    if (stock <= 3) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  async function handleSave() {
    setError(null);
    setSubmitting(true);
    try {
      const payload = rows.map((r) => ({
        id: r.id,
        size: r.size,
        colorId: r.colorId,
        stock: r.stock,
      }));
      const saved = await productsRepo.saveVariants(product.id, payload);
      const nextRows = variantsToRows(saved);
      setRows(nextRows);
      setBaseline(nextRows);
      toast.success(t("admin.saved"), product.name);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to save stock";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDiscard() {
    setRows(baseline);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/admin/products/${product.id}`}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-[#737373] transition-colors hover:text-[#0A0A0A]"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("admin.backToProduct")}
          </Link>
          <h1 className="font-heading text-xl font-bold text-[#0A0A0A] sm:text-2xl md:text-3xl">
            {product.name}
          </h1>
          <p className="mt-1 max-w-xl text-xs text-[#737373] sm:text-sm">
            {t("admin.stockPageSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={submitting}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-3 text-sm font-semibold text-[#404040] transition-colors hover:border-[#0A0A0A] disabled:opacity-60 sm:px-4"
            >
              <Undo2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t("admin.discard")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || !isDirty}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#DC2626] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {submitting ? t("admin.saving") : t("admin.save")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E5E5] px-5 py-4 sm:px-6">
          <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
            {t("admin.stockPageTitle")}
          </h2>
          <span className="text-xs text-[#737373]">
            {t("admin.totalStock")}:{" "}
            <span className="font-semibold text-[#0A0A0A]">{totalStock}</span>
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#737373] sm:px-6">
            {t("admin.noVariantsYet")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#FAFAFA] text-[11px] uppercase tracking-wider text-[#737373]">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold sm:px-6">
                    {t("admin.sizeColumn")}
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    {t("admin.colorColumn")}
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    {t("admin.stockColumn")}
                  </th>
                  <th className="px-5 py-3 text-left font-semibold">
                    {t("admin.statusColumn")}
                  </th>
                  <th className="px-5 py-3 text-right font-semibold sm:px-6">
                    {t("admin.actionsColumn")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {rows.map((row, i) => (
                  <tr key={row.id ?? `new-${sig(row.size, row.colorId)}-${i}`}>
                    <td className="px-5 py-3 font-semibold text-[#0A0A0A] sm:px-6">
                      {row.size ?? t("admin.noSize")}
                    </td>
                    <td className="px-5 py-3">
                      {row.color ? (
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#0A0A0A]">
                          <Swatch color={row.color} />
                          {colorName(row.color)}
                        </span>
                      ) : (
                        <span className="text-[#737373]">
                          {t("admin.noColor")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min={0}
                        value={row.stock}
                        onChange={(e) => updateStock(i, Number(e.target.value))}
                        className={cn(inputCls, "max-w-[120px]")}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold",
                          statusColor(row.stock)
                        )}
                      >
                        {statusLabel(row.stock)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right sm:px-6">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        aria-label={t("admin.removeVariant")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#DC2626] transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-[#E5E5E5] bg-[#FAFAFA] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {allSizes.length > 0 && (
              <select
                value={pickedSize}
                onChange={(e) => setPickedSize(e.target.value)}
                className={cn(inputCls, "max-w-[200px]")}
              >
                <option value="">{t("admin.selectSize")}</option>
                {allSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            <select
              value={pickedColorId}
              onChange={(e) => setPickedColorId(e.target.value)}
              className={cn(inputCls, "max-w-[220px]")}
            >
              <option value="">{t("admin.noColor")}</option>
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.nameFr}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addRow}
              disabled={!canAdd}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {t("admin.addVariant")}
            </button>
            {!canAdd && (pickedSize || pickedColorId) && (
              <span className="text-xs text-[#737373]">
                {t("admin.variantAlreadyExists")}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
