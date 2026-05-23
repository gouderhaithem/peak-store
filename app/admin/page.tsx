"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { formatPrice, type Product } from "@/lib/mockdata";
import { type OrderRecord } from "@/lib/orders";
import {
  productsRepo,
  ordersRepo,
  customersRepo,
  type Customer,
} from "@/lib/repository";
import { useSession } from "@/lib/auth";
import { useTranslations, useLocale } from "@/lib/i18n";

export default function AdminDashboardPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const { user } = useSession();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      ordersRepo.list(),
      productsRepo.list(),
      customersRepo.list(),
    ]).then(([o, p, c]) => {
      if (cancelled) return;
      setOrders(o);
      setProducts(p);
      setCustomers(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalCustomers = customers.length;

  const loc = locale === "ar" ? "ar-DZ" : locale;

  const stats: {
    icon: LucideIcon;
    labelKey: string;
    value: string;
  }[] = [
    {
      icon: TrendingUp,
      labelKey: "admin.stats.revenue",
      value: formatPrice(totalRevenue),
    },
    {
      icon: ShoppingBag,
      labelKey: "admin.stats.orders",
      value: totalOrders.toLocaleString(loc),
    },
    {
      icon: Package,
      labelKey: "admin.stats.products",
      value: totalProducts.toLocaleString(loc),
    },
    {
      icon: Users,
      labelKey: "admin.stats.customers",
      value: totalCustomers.toLocaleString(loc),
    },
  ];

  const recentOrders = orders.slice(0, 5);
  const topProducts = products.slice(0, 5);
  const locStr = locale === "ar" ? "ar-DZ" : locale;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A0A0A] via-[#171717] to-[#262626] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#DC2626] rounded-full blur-3xl opacity-30" />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-[#DC2626] font-semibold mb-2">
            {t("admin.welcome")}
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight mb-2">
            {t("admin.welcomeBack")} {user?.fullName ?? ""}
          </h1>
          <p className="text-[#D4D4D4] max-w-xl">{t("admin.overview")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, labelKey, value }) => (
          <div
            key={labelKey}
            className="bg-white rounded-2xl border border-[#E5E5E5] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">
              {t(labelKey)}
            </p>
            <p className="font-heading text-2xl font-bold text-[#0A0A0A]">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Two-col: recent orders + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5]">
            <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
              {t("admin.recentOrders")}
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#DC2626] hover:underline inline-flex items-center gap-1"
            >
              {t("admin.viewAllOrders")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <ul className="divide-y divide-[#E5E5E5]">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-sm font-semibold text-[#0A0A0A] hover:text-[#DC2626] transition-colors block truncate"
                    >
                      {o.id}
                    </Link>
                    <p className="text-xs text-[#737373] truncate">
                      {o.customer.fullName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#DC2626]">
                      {formatPrice(o.subtotal)}
                    </p>
                    <p className="text-xs text-[#737373]">
                      {new Date(o.createdAt).toLocaleDateString(locStr)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 text-sm text-[#737373]">
              {t("admin.noOrders")}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5]">
            <h2 className="font-heading text-lg font-bold text-[#0A0A0A]">
              {t("admin.topProducts")}
            </h2>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#DC2626] hover:underline inline-flex items-center gap-1"
            >
              {t("admin.viewAllProducts")}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-[#E5E5E5]">
            {topProducts.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-[#F5F5F5] relative">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0A0A0A] truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-[#737373]">{p.category}</p>
                </div>
                <p className="text-sm font-bold text-[#DC2626] shrink-0">
                  {formatPrice(p.price)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
