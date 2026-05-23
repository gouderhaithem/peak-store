"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/lib/i18n";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function AccountProfilePage() {
  const t = useTranslations();
  const { user } = useSession();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      })
      .eq("id", user.id);

    setSaving(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-[#0A0A0A] mb-1">
          {t("auth.myProfile")}
        </h2>
        <p className="text-sm text-[#737373]">{t("account.profileSubtitle")}</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-[#404040] mb-2">
              {t("auth.emailLabel")}
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full h-12 px-4 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#737373] text-sm cursor-not-allowed"
            />
            <p className="text-xs text-[#A3A3A3] mt-1">{t("account.emailReadOnly")}</p>
          </div>

          {/* Full name */}
          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-semibold text-[#404040] mb-2"
            >
              {t("auth.fullName")}
            </label>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("auth.fullNamePlaceholder")}
              className="w-full h-12 px-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="profile-phone"
              className="block text-sm font-semibold text-[#404040] mb-2"
            >
              {t("admin.phoneCol")}
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0555 000 000"
              className="w-full h-12 px-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {t("account.profileSaved")}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-12 px-8 bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("common.save")}
          </button>
        </form>
      </div>
    </div>
  );
}
