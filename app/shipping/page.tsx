"use client";

import Link from "next/link";
import {
  Truck,
  MapPin,
  Clock,
  Package,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "@/lib/i18n";

export default function ShippingPage() {
  const t = useTranslations();

  const zones = [
    {
      zone: t("shipping.zones.elouedZone"),
      fee: t("shipping.zones.elouedFee"),
      time: t("shipping.zones.elouedTime"),
    },
    {
      zone: t("shipping.zones.southZone"),
      fee: t("shipping.zones.southFee"),
      time: t("shipping.zones.southTime"),
    },
    {
      zone: t("shipping.zones.centerZone"),
      fee: t("shipping.zones.centerFee"),
      time: t("shipping.zones.centerTime"),
    },
    {
      zone: t("shipping.zones.westZone"),
      fee: t("shipping.zones.westFee"),
      time: t("shipping.zones.westTime"),
    },
  ];

  const highlights = [
    {
      icon: Truck,
      title: t("shipping.highlights.nationwideTitle"),
      text: t("shipping.highlights.nationwideText"),
    },
    {
      icon: CreditCard,
      title: t("shipping.highlights.codTitle"),
      text: t("shipping.highlights.codText"),
    },
    {
      icon: ShieldCheck,
      title: t("shipping.highlights.packagingTitle"),
      text: t("shipping.highlights.packagingText"),
    },
  ];

  const steps = [
    t("shipping.steps.s1"),
    t("shipping.steps.s2"),
    t("shipping.steps.s3"),
    t("shipping.steps.s4"),
    t("shipping.steps.s5"),
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
              {t("shipping.hero")}
            </span>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight mb-6">
              {t("shipping.title1")}{" "}
              <span className="text-[#DC2626]">
                {t("shipping.titleHighlight")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-[#D4D4D4] max-w-2xl mx-auto">
              {t("shipping.subtitle")}
            </p>
          </div>
        </section>

        {/* Highlights */}
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

        {/* Zones table */}
        <section className="max-w-[1100px] mx-auto px-6 py-20">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-3">
            {t("shipping.zonesTitle")}
          </h2>
          <p className="text-[#737373] mb-8">{t("shipping.zonesSubtitle")}</p>

          <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white">
            <table className="w-full text-left">
              <thead className="bg-[#FAFAFA] text-[#525252] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    {t("shipping.zoneCol")}
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    {t("shipping.feeCol")}
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    {t("shipping.timeCol")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {zones.map((z) => (
                  <tr key={z.zone} className="text-[#0A0A0A]">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#DC2626]" />
                      {z.zone}
                    </td>
                    <td className="px-6 py-4">{z.fee}</td>
                    <td className="px-6 py-4 text-[#525252] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#737373]" />
                      {z.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[#737373] mt-4">{t("shipping.note")}</p>
        </section>

        {/* Tracking */}
        <section className="bg-[#FAFAFA] py-16">
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
                  {t("shipping.trackTitle")}
                </h3>
                <p className="text-[#525252] mb-6 leading-relaxed">
                  {t("shipping.trackText")}
                </p>
                <div className="flex flex-wrap gap-3">
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
                    {t("shipping.contactSupport")}
                  </Link>
                </div>
              </div>
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-5">
                  <Package className="w-6 h-6 text-[#DC2626]" />
                  <h4 className="font-semibold text-[#0A0A0A]">
                    {t("shipping.afterOrderTitle")}
                  </h4>
                </div>
                <ol className="space-y-4 text-sm text-[#404040]">
                  {steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[#0A0A0A] text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
