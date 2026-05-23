"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { useSession } from "@/lib/auth";
import { useTranslations } from "@/lib/i18n";
import { ordersRepo } from "@/lib/repository";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { user, hydrated, isAdmin } = useSession();

  useEffect(() => {
    if (hydrated && (!user || !isAdmin)) {
      // Defer the navigation so client hydration completes
      router.replace("/login");
    }
  }, [hydrated, user, isAdmin, router]);

  // Seed mock orders the first time an admin opens the panel
  useEffect(() => {
    if (hydrated && user && isAdmin) {
      void ordersRepo.ensureSeeded().catch(() => {
        // Seeding is best-effort only; the admin UI should still render.
      });
    }
  }, [hydrated, user, isAdmin]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6">
        <div className="flex items-center gap-3 text-sm font-medium text-[#525252]">
          <span className="h-4 w-4 rounded-full border-2 border-[#D4D4D4] border-t-[#0A0A0A] animate-spin" />
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
            {t("admin.accessDenied")}
          </h1>
          <p className="text-[#525252] mb-6">{t("admin.accessDeniedDesc")}</p>
          <Link
            href="/login"
            className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
          >
            {t("login.signInBtn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F5F5F5]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
