"use client";

import { Database } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function AdminSettingsPage() {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-1">
          {t("admin.settingsTitle")}
        </h1>
        <p className="text-sm text-[#525252]">{t("admin.settingsSubtitle")}</p>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mb-5">
          <Database className="w-7 h-7" />
        </div>
        <h2 className="font-heading text-xl font-bold text-[#0A0A0A] mb-2">
          {t("admin.comingWithBackend")}
        </h2>
        <p className="text-sm text-[#525252] max-w-md mx-auto">
          {t("admin.settingsSubtitle")}
        </p>
      </div>
    </div>
  );
}
