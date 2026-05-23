"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Mail, Phone, Users } from "lucide-react";
import { customersRepo, type Customer } from "@/lib/repository";
import { WILAYAS } from "@/lib/wilayas";
import { formatPrice } from "@/lib/mockdata";
import { useTranslations, useLocale } from "@/lib/i18n";

export default function AdminCustomersPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customersRepo
      .list()
      .then((rows) => {
        if (!cancelled) {
          setCustomers(rows);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, query]);

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
          {t("admin.customersTitle")}
        </h1>
        <p className="text-sm text-[#525252]">
          {t("admin.customersSubtitle")}
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.searchCustomers")}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
          />
        </div>
        {!loading && !error && (
          <span className="text-xs font-semibold text-[#737373] shrink-0">
            {filtered.length} {filtered.length === 1 ? t("admin.customer") : t("admin.customersCount")}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[#FAFAFA] text-[#525252] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-semibold">{t("admin.nameCol")}</th>
                <th className="px-5 py-4 font-semibold">{t("admin.emailCol")}</th>
                <th className="px-5 py-4 font-semibold">{t("admin.phoneCol")}</th>
                <th className="px-5 py-4 font-semibold">{t("nav.shop")}</th>
                <th className="px-5 py-4 font-semibold">{t("admin.ordersCount")}</th>
                <th className="px-5 py-4 font-semibold">{t("admin.totalCol")}</th>
                <th className="px-5 py-4 font-semibold">{t("admin.joinedCol")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-[#F5F5F5] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Users className="w-10 h-10 text-[#D4D4D4] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#737373]">
                      {query ? t("admin.noCustomersFound") : t("admin.noCustomers")}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const wilaya = WILAYAS.find((w) => w.code === c.wilaya);
                  const wilayaName = wilaya
                    ? locale === "ar"
                      ? wilaya.nameAr
                      : wilaya.nameFr
                    : c.wilaya || "—";
                  return (
                    <tr key={c.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: c.avatarColor }}
                          >
                            {c.fullName.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-[#0A0A0A] font-medium">{c.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#404040]">
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1.5 hover:text-[#DC2626] transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {c.email}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-[#404040]">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1.5 hover:text-[#DC2626] transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {c.phone}
                          </a>
                        ) : (
                          <span className="text-[#A3A3A3]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#404040]">{wilayaName}</td>
                      <td className="px-5 py-4 text-[#0A0A0A] font-semibold">{c.ordersCount}</td>
                      <td className="px-5 py-4 font-bold text-[#DC2626] whitespace-nowrap">
                        {formatPrice(c.totalSpent)}
                      </td>
                      <td className="px-5 py-4 text-[#525252]">{dateFmt(c.joinedAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
