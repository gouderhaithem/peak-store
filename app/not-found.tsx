"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";

export default function NotFound() {
  const t = useTranslations();
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAFAFA] py-20 md:py-28">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <p className="font-heading text-7xl md:text-9xl font-bold text-[#DC2626] leading-none mb-4">
            {t("errors.notFoundCode")}
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3">
            {t("errors.notFoundTitle")}
          </h1>
          <p className="text-[#525252] mb-8 max-w-md mx-auto">
            {t("errors.notFoundText")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/"
              className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
            >
              {t("errors.notFoundBack")}
            </Link>
            <Link
              href="/shop"
              className="h-11 px-6 inline-flex items-center bg-white border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg transition-colors"
            >
              {t("errors.notFoundShop")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
