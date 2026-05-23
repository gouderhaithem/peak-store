"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Info } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";
import { useSession } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const { signIn } = useSession();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await signIn(email, password);
      toast.success(`${t("auth.signedInAs")} ${user.fullName}`);
      router.push(user.role === "admin" ? "/admin" : "/");
    } catch {
      setError(t("auth.invalidCredentials"));
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
                {t("login.welcomeTitle1")}
                <br />
                <span className="text-[#DC2626]">
                  {t("login.welcomeTitle2")}
                </span>
              </h2>
              <p className="text-[#D4D4D4] text-lg leading-relaxed max-w-sm">
                {t("login.welcomeText")}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-[#0A0A0A] bg-gradient-to-br from-[#525252] to-[#262626]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#A3A3A3]">
                  {t("login.joinChampions", { count: "5,000" })}
                </p>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 md:p-12 shadow-sm">
            <div className="mb-10">
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-2">
                {t("login.signInTitle")}
              </h1>
              <p className="text-[#737373]">
                {t("login.noAccount")}{" "}
                <Link
                  href="/register"
                  className="text-[#DC2626] font-semibold hover:underline"
                >
                  {t("login.createAccount")}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#404040] mb-2"
                >
                  {t("login.emailLabel")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t("login.emailPlaceholder")}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#404040]"
                  >
                    {t("login.passwordLabel")}
                  </label>
                  <Link
                    href="/forgot"
                    className="text-sm text-[#DC2626] font-medium hover:underline"
                  >
                    {t("login.forgot")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t("login.passwordPlaceholder")}
                    className="w-full h-12 pl-12 pr-12 rounded-lg border border-[#E5E5E5] bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#0A0A0A] transition"
                    aria-label={
                      showPassword
                        ? t("login.hidePassword")
                        : t("login.showPassword")
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

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D4D4D4] text-[#DC2626] focus:ring-[#DC2626]"
                />
                <span className="text-sm text-[#525252]">
                  {t("login.rememberMe")}
                </span>
              </label>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t("common.loading") : t("login.signInBtn")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] px-4 py-3 text-xs text-[#525252] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#737373] shrink-0 mt-0.5" />
                <div>
                  <p>{t("auth.hint")}</p>
                  <p className="text-[#737373] mt-0.5">{t("auth.hintCustomer")}</p>
                </div>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E5E5]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs text-[#737373] uppercase tracking-wider">
                    {t("login.orContinue")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="h-11 border border-[#E5E5E5] rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-[#404040] hover:bg-[#FAFAFA] transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="h-11 border border-[#E5E5E5] rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-[#404040] hover:bg-[#FAFAFA] transition"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </form>

            <p className="text-xs text-[#737373] text-center mt-8">
              {t("login.termsText")}{" "}
              <Link href="/login" className="underline hover:text-[#0A0A0A]">
                {t("login.terms")}
              </Link>{" "}
              {t("login.and")}{" "}
              <Link href="/login" className="underline hover:text-[#0A0A0A]">
                {t("login.privacy")}
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
