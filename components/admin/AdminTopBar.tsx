"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Menu,
  LogOut,
  ArrowLeft,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale, LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { useSession } from "@/lib/auth";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

const nav: NavItem[] = [
  { href: "/admin", labelKey: "admin.dashboard", icon: LayoutDashboard },
  { href: "/admin/products", labelKey: "admin.products", icon: Package },
  { href: "/admin/orders", labelKey: "admin.orders", icon: ShoppingBag },
  { href: "/admin/customers", labelKey: "admin.customers", icon: Users },
  { href: "/admin/settings", labelKey: "admin.settings", icon: Settings },
];

export default function AdminTopBar() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();
  const { user, signOut } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSignOut() {
    signOut();
    router.replace("/");
  }

  const currentLabel = nav.find((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href)
  );

  return (
    <header className="h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 lg:px-8 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Menu"
          className="lg:hidden p-2 -ml-2 text-[#0A0A0A] hover:text-[#DC2626] transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#737373]">
            {t("admin.title")}
          </p>
          <p className="text-sm font-semibold text-[#0A0A0A]">
            {currentLabel ? t(currentLabel.labelKey) : t("admin.dashboard")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Locale switcher */}
        <div className="relative group hidden md:block">
          <button className="text-xs font-semibold uppercase tracking-wider text-[#525252] hover:text-[#0A0A0A] transition-colors py-2 px-2">
            {locale}
          </button>
          <div className="absolute top-full right-0 bg-white border border-[#E5E5E5] rounded-lg py-2 min-w-[140px] shadow-md opacity-0 invisible translate-y-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
            {LOCALES.map((code) => (
              <button
                key={code}
                onClick={() => setLocale(code)}
                className={cn(
                  "block w-full text-left px-4 py-2 text-xs hover:bg-[#FAFAFA] transition-colors",
                  locale === code
                    ? "text-[#DC2626] font-semibold"
                    : "text-[#404040]"
                )}
              >
                {LOCALE_LABELS[code]}
              </button>
            ))}
          </div>
        </div>

        {/* User */}
        {user && (
          <div className="relative group">
            <button
              aria-label={t("auth.myAccount")}
              className="flex items-center gap-2 text-[#0A0A0A] hover:text-[#DC2626] transition-colors py-1"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden md:inline text-sm font-medium">
                {user.fullName}
              </span>
            </button>
            <div className="absolute top-full right-0 bg-white border border-[#E5E5E5] rounded-lg py-2 min-w-[200px] shadow-md opacity-0 invisible translate-y-[-8px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#404040] hover:bg-[#FAFAFA] hover:text-[#0A0A0A] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("admin.backToStore")}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#404040] hover:bg-[#FAFAFA] hover:text-[#DC2626] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t("auth.signOut")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-y-0 left-0 w-72 bg-[#0A0A0A] text-white flex flex-col"
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
              <span className="text-sm font-bold">{t("admin.title")}</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t("common.close")}
                className="text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <ul className="space-y-1">
                {nav.map(({ href, labelKey, icon: Icon }) => {
                  const active =
                    href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          active
                            ? "bg-[#DC2626] text-white"
                            : "text-[#D4D4D4] hover:bg-white/5"
                        )}
                      >
                        <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                        {t(labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-white/10 p-3">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#A3A3A3] hover:bg-white/5 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("admin.backToStore")}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
