"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "@/lib/i18n";
import { homeContentRepo, pickText } from "@/lib/repository/homeContent";
import type { HomeSection } from "@/lib/repository/homeContent";

export default function HeroSection() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [section, setSection] = useState<HomeSection | null>(null);

  useEffect(() => {
    let cancelled = false;
    homeContentRepo
      .list()
      .then((rows) => {
        if (cancelled) return;
        setSection(rows.find((r) => r.slug === "hero") ?? null);
      })
      .catch(() => {
        if (!cancelled) setSection(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide entirely if the admin disabled the hero, mirroring the behavior
  // we use for the promotion section.
  if (section && !section.isActive) return null;

  const title = section ? pickText(section.title, locale) : t("home.heroTitle1");
  const accent = section
    ? pickText(section.accent, locale)
    : t("home.heroTitle2");
  const description = section
    ? pickText(section.description, locale)
    : t("home.heroSubtitle");
  const ctaLabel = section
    ? pickText(section.ctaLabel, locale) || t("home.heroShopNow")
    : t("home.heroShopNow");
  const ctaHref = section?.ctaHref || "/shop";

  return (
    <section className="max-w-[1400px] mx-auto px-6 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
      {/* Content */}
      <div>
        <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 text-[#0A0A0A]">
          {title}
          {accent && <span className="block text-[#DC2626]">{accent}</span>}
        </h1>
        <p className="text-lg text-[#525252] mb-10 max-w-[500px] leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={ctaHref}
            className="inline-block bg-[#0A0A0A] text-white px-8 py-4 rounded-lg font-semibold text-base hover:bg-[#262626] hover:-translate-y-0.5 transition-all duration-200 text-center"
          >
            {ctaLabel}
          </Link>
          <Link
            href="/shop"
            className="inline-block bg-white text-[#0A0A0A] px-8 py-4 rounded-lg font-semibold text-base border-2 border-[#E5E5E5] hover:border-[#0A0A0A] transition-all duration-200 text-center"
          >
            {t("home.heroViewCollections")}
          </Link>
        </div>
      </div>

      {/* Visual */}
      <div className="relative h-[400px] lg:h-[600px] bg-[#F5F5F5] rounded-3xl overflow-hidden flex items-center justify-center">
        {section?.imageUrl ? (
          <Image
            src={section.imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="text-center text-[#A3A3A3] text-lg font-medium px-10">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#E5E5E5] flex items-center justify-center">
              <svg className="w-12 h-12 text-[#D4D4D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p>{t("home.heroVisualPlaceholder")}</p>
            <p className="text-sm mt-2 text-[#D4D4D4]">
              {t("home.heroVisualHint")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
