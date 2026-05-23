"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User, ChevronRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hydrated } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login?next=" + encodeURIComponent(pathname));
    }
  }, [hydrated, user, router, pathname]);

  if (!hydrated || !user) {
    return (
      <>
        <Navbar />
        <main className="flex-1 min-h-[60vh] bg-[#FAFAFA]" />
        <Footer />
      </>
    );
  }

  const tabs = [
    { href: "/account/orders", icon: ShoppingBag, label: t("auth.myOrders") },
    { href: "/account/profile", icon: User, label: t("auth.myProfile") },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-[#737373] mb-4">
              <Link href="/" className="hover:text-[#0A0A0A] transition-colors">
                {t("product.breadcrumbHome")}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#0A0A0A] font-medium">{t("auth.myAccount")}</span>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="font-heading text-2xl font-bold text-[#0A0A0A]">
                  {user.fullName}
                </h1>
                <p className="text-sm text-[#737373]">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-56 shrink-0">
              <nav className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
                {tabs.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-5 py-4 text-sm font-medium transition-colors border-b border-[#E5E5E5] last:border-b-0",
                        active
                          ? "bg-[#FEF2F2] text-[#DC2626]"
                          : "text-[#404040] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
