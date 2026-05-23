"use client";

import Link from "next/link";
import {
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  PackageCheck,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";

export default function ReturnsPage() {
  const t = useTranslations();

  const eligible = [
    t("returns.eligible.i1"),
    t("returns.eligible.i2"),
    t("returns.eligible.i3"),
    t("returns.eligible.i4"),
  ];

  const notEligible = [
    t("returns.notEligible.i1"),
    t("returns.notEligible.i2"),
    t("returns.notEligible.i3"),
    t("returns.notEligible.i4"),
  ];

  const steps = [
    { title: t("returns.steps.s1Title"), text: t("returns.steps.s1Text") },
    { title: t("returns.steps.s2Title"), text: t("returns.steps.s2Text") },
    { title: t("returns.steps.s3Title"), text: t("returns.steps.s3Text") },
    { title: t("returns.steps.s4Title"), text: t("returns.steps.s4Text") },
  ];

  const highlights = [
    {
      icon: Calendar,
      title: t("returns.highlights.windowTitle"),
      text: t("returns.highlights.windowText"),
    },
    {
      icon: RefreshCw,
      title: t("returns.highlights.exchangeTitle"),
      text: t("returns.highlights.exchangeText"),
    },
    {
      icon: PackageCheck,
      title: t("returns.highlights.refundTitle"),
      text: t("returns.highlights.refundText"),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#0A0A0A] text-white py-20 md:py-28 overflow-hidden">
          <div className="absolute -top-24 right-1/4 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl opacity-20" />
          <div className="relative max-w-[1400px] mx-auto px-6 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#DC2626] mb-4">
              {t("returns.hero")}
            </span>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight mb-6">
              {t("returns.title1")}{" "}
              <span className="text-[#DC2626]">
                {t("returns.titleHighlight")}
              </span>
              {t("returns.title2")}
            </h1>
            <p className="text-lg md:text-xl text-[#D4D4D4] max-w-2xl mx-auto">
              {t("returns.subtitle")}
            </p>
          </div>
        </section>

        {/* Quick policy cards */}
        <section className="max-w-[1400px] mx-auto px-6 -mt-12 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-[#0A0A0A] font-semibold text-lg mb-2">
                  {title}
                </h3>
                <p className="text-sm text-[#737373] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Eligibility */}
        <section className="max-w-[1100px] mx-auto px-6 py-20">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3">
            {t("returns.eligibleTitle")}
          </h2>
          <p className="text-[#737373] mb-8">{t("returns.eligibleSubtitle")}</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-[#0A0A0A]">
                  {t("returns.eligibleHeader")}
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-[#404040]">
                {eligible.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-[#DC2626]" />
                <h3 className="font-semibold text-[#0A0A0A]">
                  {t("returns.notEligibleHeader")}
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-[#404040]">
                {notEligible.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="bg-[#FAFAFA] py-20">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3">
                {t("returns.howItWorks")}
              </h2>
              <p className="text-[#737373]">
                {t("returns.howItWorksSubtitle")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, idx) => (
                <div
                  key={step.title}
                  className="bg-white border border-[#E5E5E5] rounded-2xl p-6 relative"
                >
                  <span className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-[#DC2626] text-white font-bold flex items-center justify-center shadow-md">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold text-[#0A0A0A] mb-2 mt-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#737373] leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[1100px] mx-auto px-6 py-16 text-center">
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
            {t("returns.ctaTitle")}
          </h3>
          <p className="text-[#737373] mb-6">{t("returns.ctaText")}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://wa.me/213780137475"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-6 inline-flex items-center bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors"
            >
              {t("common.whatsappUs")}
            </a>
            <Link
              href="/contact"
              className="h-11 px-6 inline-flex items-center bg-white border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg transition-colors"
            >
              {t("returns.openRequest")}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
