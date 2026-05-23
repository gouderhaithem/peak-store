"use client";

import { Truck, RefreshCw, CreditCard } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function FeaturesSection() {
  const t = useTranslations();

  const features = [
    {
      icon: Truck,
      title: t("home.features.delivery"),
      description: t("home.features.deliveryDesc"),
    },
    {
      icon: RefreshCw,
      title: t("home.features.returns"),
      description: t("home.features.returnsDesc"),
    },
    {
      icon: CreditCard,
      title: t("home.features.payment"),
      description: t("home.features.paymentDesc"),
    },
  ];

  return (
    <section className="bg-white py-20 px-6 border-t border-b border-[#E5E5E5]">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-16">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Icon className="w-14 h-14 text-[#404040]" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-lg font-semibold uppercase tracking-wider text-[#0A0A0A] mb-3">
                {feature.title}
              </h3>
              <p className="text-[15px] text-[#525252] leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
