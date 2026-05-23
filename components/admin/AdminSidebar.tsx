"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  ArrowLeft,
  Layout,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

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
  { href: "/admin/home", labelKey: "admin.homeContent", icon: Layout },
  { href: "/admin/messages", labelKey: "admin.messages.nav", icon: MessageSquare },
  { href: "/admin/settings", labelKey: "admin.settings", icon: Settings },
];

export default function AdminSidebar() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-[#0A0A0A] text-white flex-col">
      {/* Logo */}
      <div className="h-20 px-6 flex items-center border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/peak-logo.webp"
            alt="Peak Store"
            width={100}
            height={40}
            className="h-9 w-auto object-contain brightness-0 invert"
          />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-full px-2 py-0.5">
            {t("admin.title")}
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-[#DC2626] text-white"
                      : "text-[#D4D4D4] hover:bg-white/5 hover:text-white"
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

      {/* Bottom: back to store */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#A3A3A3] hover:bg-white/5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("admin.backToStore")}
        </Link>
      </div>
    </aside>
  );
}
