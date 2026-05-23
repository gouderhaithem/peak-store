"use client";

import Link from "next/link";
import { Trophy, Heart, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";

export default function AboutPage() {
  const t = useTranslations();

  const values = [
    {
      icon: Trophy,
      title: t("about.values.authenticTitle"),
      text: t("about.values.authenticText"),
    },
    {
      icon: Heart,
      title: t("about.values.builtTitle"),
      text: t("about.values.builtText"),
    },
    {
      icon: Sparkles,
      title: t("about.values.freshTitle"),
      text: t("about.values.freshText"),
    },
    {
      icon: Users,
      title: t("about.values.localTitle"),
      text: t("about.values.localText"),
    },
  ];

  const stats = [
    { value: "500+", label: t("about.stats.styles") },
    { value: "58", label: t("about.stats.wilayas") },
    { value: "10k+", label: t("about.stats.customers") },
    { value: "8 AM", label: t("about.stats.open") },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#0A0A0A] text-white py-20 md:py-28 overflow-hidden">
          <div className="absolute -top-24 right-1/4 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl opacity-20" />
          <div className="absolute -bottom-32 left-10 w-80 h-80 bg-[#DC2626] rounded-full blur-3xl opacity-10" />
          <div className="relative max-w-[1400px] mx-auto px-6 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#DC2626] mb-4">
              {t("about.hero")}
            </span>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              {t("about.title1")}{" "}
              <span className="text-[#DC2626]">{t("about.titleHighlight")}</span>
              {t("about.title2")}
            </h1>
            <p className="text-lg md:text-xl text-[#D4D4D4] max-w-2xl mx-auto">
              {t("about.subtitle")}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="max-w-[1100px] mx-auto px-6 py-20">
          <div className="prose prose-neutral max-w-none">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-6">
              {t("about.storyTitle")}
            </h2>
            <p className="text-[#404040] text-lg leading-relaxed mb-5">
              {t("about.storyP1")}
            </p>
            <p className="text-[#404040] text-lg leading-relaxed mb-5">
              {t("about.storyP2")}
            </p>
            <p className="text-[#404040] text-lg leading-relaxed">
              {t("about.storyP3")}
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="bg-[#FAFAFA] py-20">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3">
                {t("about.valuesTitle")}
              </h2>
              <p className="text-[#737373]">{t("about.valuesSubtitle")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="bg-white border border-[#E5E5E5] rounded-2xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-[#737373] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-[1400px] mx-auto px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-[#0A0A0A] text-white rounded-2xl py-10"
              >
                <p className="font-heading text-4xl md:text-5xl font-bold text-[#DC2626] mb-2">
                  {stat.value}
                </p>
                <p className="text-sm uppercase tracking-wider text-[#A3A3A3]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#FAFAFA] py-16">
          <div className="max-w-[1400px] mx-auto px-6 text-center">
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
              {t("about.ctaTitle")}
            </h3>
            <p className="text-[#737373] mb-6">{t("about.ctaText")}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/shop"
                className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
              >
                {t("about.ctaVisit")}
              </Link>
              <Link
                href="/contact"
                className="h-11 px-6 inline-flex items-center bg-white border border-[#E5E5E5] hover:border-[#0A0A0A] text-[#0A0A0A] font-semibold rounded-lg transition-colors"
              >
                {t("about.ctaContact")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
