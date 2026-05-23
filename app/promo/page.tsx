"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, Tag, Zap, Gift, ArrowRight, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/shop/ProductCard";
import { formatPrice, type Product } from "@/lib/mockdata";
import { productsRepo } from "@/lib/repository";
import { useTranslations } from "@/lib/i18n";

function Countdown() {
  const t = useTranslations();
  const target = 1000 * 60 * 60 * 24 * 2;
  const [remaining, setRemaining] = useState(target);

  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  const blocks = [
    { label: t("promo.days"), value: days },
    { label: t("promo.hours"), value: hours },
    { label: t("promo.minutes"), value: minutes },
    { label: t("promo.seconds"), value: seconds },
  ];

  return (
    <div className="flex gap-3">
      {blocks.map((b) => (
        <div
          key={b.label}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 min-w-[72px] text-center"
        >
          <div className="font-heading text-2xl md:text-3xl font-bold text-white tabular-nums">
            {String(b.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/70 mt-1">
            {b.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PromoPage() {
  const t = useTranslations();
  const [discounted, setDiscounted] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productsRepo.list().then((products) => {
      if (!cancelled) {
        setDiscounted(products.filter((p) => p.discount).slice(0, 8));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  }

  const topDeal = discounted[0];

  const heroOffers = [
    {
      badge: t("promo.offers.megaDeal"),
      title: t("promo.offers.megaTitle"),
      subtitle: t("promo.offers.megaSubtitle"),
      color: "from-[#DC2626] to-[#991B1B]",
      icon: Flame,
      href: "/shop?type=running",
    },
    {
      badge: t("promo.offers.weekendOnly"),
      title: t("promo.offers.weekendTitle"),
      subtitle: t("promo.offers.weekendSubtitle"),
      color: "from-[#0A0A0A] to-[#262626]",
      icon: Gift,
      href: "/shop?type=apparel",
    },
  ];

  const promoCategories = [
    {
      label: t("promo.categories.flashSale"),
      value: t("promo.categories.flashSaleVal"),
      icon: Zap,
      accent: "text-[#DC2626]",
      bg: "bg-[#FEE2E2]",
    },
    {
      label: t("promo.categories.clearance"),
      value: t("promo.categories.clearanceVal"),
      icon: Tag,
      accent: "text-[#0A0A0A]",
      bg: "bg-[#F5F5F5]",
    },
    {
      label: t("promo.categories.memberDrop"),
      value: t("promo.categories.memberDropVal"),
      icon: Gift,
      accent: "text-[#B91C1C]",
      bg: "bg-[#FDE2E4]",
    },
    {
      label: t("promo.categories.bundles"),
      value: t("promo.categories.bundlesVal"),
      icon: Flame,
      accent: "text-[#DC2626]",
      bg: "bg-[#FEE2E2]",
    },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-[#0A0A0A] via-[#171717] to-[#0A0A0A] text-white overflow-hidden">
          <div className="absolute -top-32 -right-20 w-[500px] h-[500px] bg-[#DC2626] rounded-full blur-[120px] opacity-30" />
          <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] bg-[#DC2626] rounded-full blur-[120px] opacity-20" />

          <div className="relative max-w-[1400px] mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DC2626]/20 border border-[#DC2626]/30 text-[#FCA5A5] text-xs font-semibold uppercase tracking-widest mb-6">
                <Flame className="w-3.5 h-3.5" />
                {t("promo.hot")}
              </span>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
                {t("promo.title1")}{" "}
                <span className="text-[#DC2626]">
                  {t("promo.titleHighlight")}
                </span>
                <br />
                {t("promo.title2")}
              </h1>
              <p className="text-lg text-[#D4D4D4] max-w-lg mb-8">
                {t("promo.subtitle")}{" "}
                <span className="text-white font-bold">
                  {t("promo.subtitleBold")}
                </span>{" "}
                {t("promo.subtitleEnd")}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock className="w-4 h-4 text-[#DC2626]" />
                  {t("promo.saleEndsIn")}
                </div>
                <Countdown />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/shop?discount=true"
                  className="h-12 px-7 inline-flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors"
                >
                  {t("promo.shopAllDeals")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="h-12 px-7 inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white hover:text-[#0A0A0A] text-white font-semibold rounded-lg transition-colors"
                >
                  {t("promo.unlockMember")}
                </Link>
              </div>
            </div>

            {/* Featured deal card */}
            {topDeal && (
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#DC2626] rounded-full blur-3xl opacity-50" />
                <div className="relative bg-white text-[#0A0A0A] rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#737373]">
                      {t("promo.todayTopDeal")}
                    </span>
                    <span className="bg-[#DC2626] text-white font-bold text-sm px-3 py-1.5 rounded-full">
                      -{topDeal.discount}%
                    </span>
                  </div>
                  <div className="aspect-[4/3] bg-[#F5F5F5] rounded-2xl mb-6 flex items-center justify-center">
                    <svg
                      className="w-20 h-20 text-[#D4D4D4]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#737373] mb-2">
                    {topDeal.category}
                  </p>
                  <h3 className="text-2xl font-bold mb-3">{topDeal.name}</h3>
                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="text-3xl font-bold text-[#DC2626]">
                      {formatPrice(topDeal.price)}
                    </span>
                    {topDeal.originalPrice && (
                      <span className="text-lg text-[#A3A3A3] line-through">
                        {formatPrice(topDeal.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/shop/${topDeal.id}`}
                    className="w-full h-12 bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors inline-flex items-center justify-center"
                  >
                    {t("promo.grabDeal")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Category strip */}
        <section className="max-w-[1400px] mx-auto px-6 -mt-10 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {promoCategories.map(({ label, value, icon: Icon, accent, bg }) => (
              <div
                key={label}
                className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${bg} ${accent} flex items-center justify-center mb-3`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#737373] mb-1">
                  {label}
                </p>
                <p className="text-[#0A0A0A] font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hero offer banners */}
        <section className="max-w-[1400px] mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-6">
            {heroOffers.map(({ badge, title, subtitle, color, icon: Icon, href }) => (
              <Link
                key={title}
                href={href}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-10 text-white min-h-[260px] flex flex-col justify-between hover:scale-[1.01] transition-transform`}
              >
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                <div className="relative">
                  <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
                    {badge}
                  </span>
                  <h3 className="font-heading text-3xl md:text-4xl font-bold leading-tight mb-3 max-w-md">
                    {title}
                  </h3>
                  <p className="text-white/80 max-w-sm">{subtitle}</p>
                </div>
                <div className="relative flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-semibold text-sm group-hover:gap-3 transition-all">
                    {t("common.shopNow")}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                  <Icon className="w-14 h-14 opacity-30 group-hover:opacity-50 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Promo products grid */}
        <section className="max-w-[1400px] mx-auto px-6 pb-20">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#DC2626] mb-2 block">
                {t("promo.sectionLabel")}
              </span>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A]">
                {t("promo.sectionTitle")}
              </h2>
            </div>
            <Link
              href="/shop?discount=true"
              className="text-sm font-semibold text-[#0A0A0A] hover:text-[#DC2626] inline-flex items-center gap-2 transition-colors"
            >
              {t("promo.viewAll")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {discounted.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {discounted.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#737373]">
              {t("promo.noPromos")}
            </div>
          )}
        </section>

        {/* Newsletter CTA */}
        <section className="bg-[#0A0A0A] text-white py-16">
          <div className="max-w-[1400px] mx-auto px-6 text-center">
            <h3 className="font-heading text-3xl md:text-4xl font-bold mb-3">
              {t("promo.newsletterTitle")}{" "}
              <span className="text-[#DC2626]">
                {t("promo.newsletterHighlight")}
              </span>
              .
            </h3>
            <p className="text-[#A3A3A3] mb-8 max-w-lg mx-auto">
              {t("promo.newsletterText")}
            </p>
            {subscribed ? (
              <p className="text-[#DC2626] font-semibold text-lg">
                ✓ {t("promo.subscribed") || "Merci ! Vous êtes inscrit(e)."}
              </p>
            ) : (
              <form
                onSubmit={handleNewsletter}
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("promo.emailPlaceholder")}
                  className="flex-1 h-12 px-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/30 transition"
                />
                <button
                  type="submit"
                  className="h-12 px-7 bg-[#DC2626] hover:bg-[#B91C1C] font-semibold rounded-lg transition-colors"
                >
                  {t("common.subscribe")}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
