"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqGroup {
  category: string;
  items: FaqItem[];
}

function FaqAccordion({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-[#FAFAFA] transition-colors"
      >
        <span className="font-semibold text-[#0A0A0A] text-base md:text-lg">
          {item.q}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-[#737373] shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-[#DC2626]"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-[#525252] leading-relaxed">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const groups: FaqGroup[] = [
    {
      category: t("faq.categories.orders"),
      items: [
        { q: t("faq.items.orders1Q"), a: t("faq.items.orders1A") },
        { q: t("faq.items.orders2Q"), a: t("faq.items.orders2A") },
        { q: t("faq.items.orders3Q"), a: t("faq.items.orders3A") },
      ],
    },
    {
      category: t("faq.categories.shipping"),
      items: [
        { q: t("faq.items.shipping1Q"), a: t("faq.items.shipping1A") },
        { q: t("faq.items.shipping2Q"), a: t("faq.items.shipping2A") },
        { q: t("faq.items.shipping3Q"), a: t("faq.items.shipping3A") },
      ],
    },
    {
      category: t("faq.categories.returns"),
      items: [
        { q: t("faq.items.returns1Q"), a: t("faq.items.returns1A") },
        { q: t("faq.items.returns2Q"), a: t("faq.items.returns2A") },
        { q: t("faq.items.returns3Q"), a: t("faq.items.returns3A") },
      ],
    },
    {
      category: t("faq.categories.products"),
      items: [
        { q: t("faq.items.products1Q"), a: t("faq.items.products1A") },
        { q: t("faq.items.products2Q"), a: t("faq.items.products2A") },
        { q: t("faq.items.products3Q"), a: t("faq.items.products3A") },
      ],
    },
  ];

  const filtered = groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.q.toLowerCase().includes(query.toLowerCase()) ||
          i.a.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#0A0A0A] text-white py-20 md:py-28 overflow-hidden">
          <div className="absolute -top-24 right-1/4 w-96 h-96 bg-[#DC2626] rounded-full blur-3xl opacity-20" />
          <div className="relative max-w-[1400px] mx-auto px-6 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#DC2626] mb-4">
              {t("faq.hero")}
            </span>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight mb-6">
              {t("faq.title1")}{" "}
              <span className="text-[#DC2626]">{t("faq.titleHighlight")}</span>
            </h1>
            <p className="text-lg md:text-xl text-[#D4D4D4] max-w-2xl mx-auto mb-8">
              {t("faq.subtitle")}
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("faq.searchPlaceholder")}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#DC2626] transition"
              />
            </div>
          </div>
        </section>

        {/* FAQ Groups */}
        <section className="max-w-[900px] mx-auto px-6 py-16 space-y-12">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E5E5E5] rounded-2xl">
              <p className="text-[#737373] mb-2">{t("faq.noResults")}</p>
              <p className="text-[#0A0A0A] font-semibold mb-6">
                &ldquo;{query}&rdquo;
              </p>
              <Link
                href="/contact"
                className="h-11 px-6 inline-flex items-center bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold rounded-lg transition-colors"
              >
                {t("faq.askDirectly")}
              </Link>
            </div>
          ) : (
            filtered.map((group) => (
              <div key={group.category}>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-5">
                  {group.category}
                </h2>
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const key = `${group.category}-${item.q}`;
                    return (
                      <FaqAccordion
                        key={key}
                        item={item}
                        isOpen={openKey === key}
                        onToggle={() =>
                          setOpenKey(openKey === key ? null : key)
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* CTA */}
        <section className="bg-[#FAFAFA] py-16">
          <div className="max-w-[1100px] mx-auto px-6 text-center">
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] mb-3">
              {t("faq.stillNeedHelp")}
            </h3>
            <p className="text-[#737373] mb-6">{t("faq.teamReady")}</p>
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
                {t("faq.contactForm")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
