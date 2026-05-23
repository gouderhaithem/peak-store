"use client";

import { useEffect, useState } from "react";
import { Layout } from "lucide-react";
import HomeSectionEditor from "@/components/admin/HomeSectionEditor";
import { homeContentRepo } from "@/lib/repository/homeContent";
import type { HomeSection } from "@/lib/repository/homeContent";
import { useTranslations } from "@/lib/i18n";

export default function AdminHomeContentPage() {
  const t = useTranslations();
  const [sections, setSections] = useState<HomeSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    homeContentRepo
      .listForAdmin()
      .then((rows) => {
        if (!cancelled) setSections(rows);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSaved(next: HomeSection) {
    setSections((curr) =>
      curr ? curr.map((s) => (s.slug === next.slug ? next : s)) : curr
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
            <Layout className="w-5 h-5" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A]">
            {t("admin.homeContent")}
          </h1>
        </div>
        <p className="text-[#525252] max-w-2xl">
          {t("admin.homeContentDesc")}
        </p>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {sections === null && !error && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-white border border-[#E5E5E5] animate-pulse"
            />
          ))}
        </div>
      )}

      {sections && (
        <div className="space-y-6">
          {sections.map((section) => (
            <HomeSectionEditor
              key={section.slug}
              section={section}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
