"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/lib/auth";

export default function RegisterPage() {
  const t = useTranslations();
  const toast = useToast();
  const router = useRouter();
  const { signUp } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError(t("login.passwordsDontMatch"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { needsConfirmation } = await signUp(
        form.email,
        form.password,
        form.fullName,
      );
      if (needsConfirmation) {
        toast.success(
          t("login.registerTitle"),
          "Check your email to confirm your account.",
        );
        router.push("/login");
      } else {
        toast.success(t("login.registerTitle"), form.fullName);
        router.push("/");
      }
    } catch (err) {
      // Supabase returns descriptive messages (e.g. "User already registered",
      // "Password should be at least 6 characters"). Surface them directly —
      // they're already user-friendly.
      const message =
        err instanceof Error ? err.message : t("auth.invalidCredentials");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAFAFA] py-16 md:py-24">
        <div className="max-w-[1100px] mx-auto px-6 grid lg:grid-cols-2 gap-10 items-stretch">
          {/* Left visual panel */}
          <div className="hidden lg:flex relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#171717] to-[#262626] p-12 text-white flex-col justify-between min-h-[600px]">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#DC2626] rounded-full blur-3xl opacity-30" />
            <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl opacity-20" />

            <div className="relative z-10">
              <Image
                src="/peak-logo.webp"
                alt="Peak Store"
                width={140}
                height={56}
                className="h-14 w-auto object-contain brightness-0 invert"
                priority
              />
            </div>

            <div className="relative z-10 space-y-6">
              <h2 className="font-heading text-5xl font-bold leading-tight">
                {t("login.welcomeRegisterTitle1")}
                <br />
                <span className="text-[#DC2626]">
                  {t("login.welcomeRegisterTitle2")}
                </span>
              </h2>
              <p className="text-[#D4D4D4] text-lg leading-relaxed max-w-sm">
                {t("login.welcomeRegisterText")}
              </p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 md:p-12 shadow-sm">
            <div className="mb-10">
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-2">
                {t("login.registerTitle")}
              </h1>
              <p className="text-[#737373]">
                {t("login.haveAccount")}{" "}
                <Link
                  href="/login"
                  className="text-[#DC2626] font-semibold hover:underline"
                >
                  {t("login.signInLink")}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#404040] mb-2">
                  {t("login.fullName")}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    required
                    placeholder={t("login.fullNamePlaceholder")}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#404040] mb-2">
                  {t("login.emailLabel")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    placeholder={t("login.emailPlaceholder")}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#404040] mb-2">
                  {t("login.passwordLabel")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    placeholder={t("login.passwordPlaceholder")}
                    className="w-full h-12 pl-12 pr-12 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0A0A0A] transition"
                    aria-label={
                      showPassword ? t("login.hidePassword") : t("login.showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#404040] mb-2">
                  {t("login.confirmPassword")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.confirm}
                    onChange={(e) =>
                      setForm({ ...form, confirm: e.target.value })
                    }
                    required
                    placeholder={t("login.passwordPlaceholder")}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                  />
                </div>
                {error && (
                  <p className="text-xs text-[#DC2626] mt-2">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t("common.loading") : t("login.registerBtn")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-xs text-[#737373] text-center">
                {t("login.termsText")}{" "}
                <Link href="/register" className="underline hover:text-[#0A0A0A]">
                  {t("login.terms")}
                </Link>{" "}
                {t("login.and")}{" "}
                <Link href="/register" className="underline hover:text-[#0A0A0A]">
                  {t("login.privacy")}
                </Link>
                .
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
