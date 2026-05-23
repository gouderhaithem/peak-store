"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    if (typeof console !== "undefined") {
      // surface for debugging; replace with Sentry/Logger after backend integration
      console.error(error);
    }
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAFAFA] py-20 md:py-28">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#DC2626] mb-3">
            {t("errors.serverCode")}
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3">
            {t("errors.serverTitle")}
          </h1>
          <p className="text-[#525252] mb-8 max-w-md mx-auto">
            {t("errors.serverText")}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="h-11 px-6 inline-flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              {t("errors.serverRetry")}
            </button>
            <Link
              href="/"
              className="h-11 px-6 inline-flex items-center bg-white border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg transition-colors"
            >
              {t("errors.notFoundBack")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
