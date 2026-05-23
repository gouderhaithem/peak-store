"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAFAFA] py-20 md:py-28">
        <div className="max-w-[480px] mx-auto px-6">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 md:p-10 shadow-sm">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#0A0A0A] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("login.backToLogin")}
            </Link>

            {sent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-[#0A0A0A] mb-3">
                  {t("login.forgotTitle")}
                </h1>
                <p className="text-sm text-[#525252]">
                  {t("login.forgotSent")}
                </p>
              </div>
            ) : (
              <>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
                  {t("login.forgotTitle")}
                </h1>
                <p className="text-[#737373] mb-8">
                  {t("login.forgotSubtitle")}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#404040] mb-2">
                      {t("login.emailLabel")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={t("login.emailPlaceholder")}
                        className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group"
                  >
                    {t("login.forgotBtn")}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
