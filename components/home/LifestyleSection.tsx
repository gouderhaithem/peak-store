"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, type LifestyleSection } from "@/lib/mockdata";
import { productsRepo } from "@/lib/repository";
import {
  homeContentRepo,
  pickText,
  type HomeSection,
} from "@/lib/repository/homeContent";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Layout details kept in code: per-section gradient, which side the
// image sits on, and CTA accent color. Admin doesn't manage these —
// just text + image + visibility.
const layoutBySlug: Record<
  string,
  { bgClass: string; reverse: boolean; accent: "default" | "red" }
> = {
  apparel: {
    bgClass: "bg-gradient-to-br from-[#FDE2E4] to-[#FFC2D1]",
    reverse: false,
    accent: "default",
  },
  performance: {
    bgClass: "bg-[#F5F5F5]",
    reverse: true,
    accent: "default",
  },
  kids: {
    bgClass: "bg-gradient-to-br from-[#A7D4F5] to-[#7EC8E3]",
    reverse: false,
    accent: "default",
  },
  promotion: {
    bgClass: "bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7]",
    reverse: true,
    accent: "red",
  },
};

function ImagePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center text-center text-black/30 font-medium">
      <div>
        <svg
          className="w-16 h-16 mx-auto mb-3 opacity-20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
}

export default function LifestyleSections() {
  const { locale } = useLocale();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [products, setProducts] = useState<LifestyleSection[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      homeContentRepo.list(),
      productsRepo.listLifestyle(),
    ]).then(([content, lifestyle]) => {
      if (cancelled) return;
      setSections(content.filter((s) => s.kind === "lifestyle" && s.isActive));
      setProducts(lifestyle);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {sections.map((section) => {
        const layout = layoutBySlug[section.slug] ?? {
          bgClass: "bg-[#FAFAFA]",
          reverse: false,
          accent: "default" as const,
        };
        // The product row for each lifestyle section still comes from the
        // legacy lifestyle mock — see decision §2 in supabase-schema.md.
        const productRow = products.find((p) => p.id === section.slug);
        const title = pickText(section.title, locale);
        const description = pickText(section.description, locale);
        const ctaLabel = pickText(section.ctaLabel, locale);

        return (
          <section
            key={section.slug}
            className={cn("py-20 overflow-hidden", layout.bgClass)}
          >
            <div className="max-w-[1400px] mx-auto px-6">
              <div
                className={cn(
                  "grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 items-center mb-16",
                  layout.reverse && "lg:grid-cols-[1fr_1.2fr]"
                )}
              >
                {/* Image */}
                <div
                  className={cn(
                    "relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden bg-white/50",
                    layout.reverse && "lg:order-last"
                  )}
                >
                  {section.imageUrl ? (
                    <Image
                      src={section.imageUrl}
                      alt={title}
                      fill
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>

                {/* Text */}
                <div className={cn(layout.reverse && "lg:order-first")}>
                  <h2 className="font-heading text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-[#0A0A0A] mb-5">
                    {title}
                  </h2>
                  {description && (
                    <p className="text-lg text-[#404040] mb-8 leading-relaxed">
                      {description}
                    </p>
                  )}
                  {ctaLabel && (
                    <Link
                      href={section.ctaHref || "/shop"}
                      className={cn(
                        "inline-block px-8 py-4 rounded-lg font-semibold text-base text-white transition-all duration-200 hover:-translate-y-0.5",
                        layout.accent === "red"
                          ? "bg-[#DC2626] hover:bg-[#B91C1C]"
                          : "bg-[#0A0A0A] hover:bg-[#262626]"
                      )}
                    >
                      {ctaLabel}
                    </Link>
                  )}
                </div>
              </div>

              {/* Product row */}
              {productRow && productRow.products.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {productRow.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/shop/${product.id}`}
                      className="bg-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all duration-300 relative group cursor-pointer block"
                    >
                      {product.originalPrice && (
                        <span className="absolute top-3 right-3 bg-[#DC2626] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-[0_2px_8px_rgba(220,38,38,0.4)]">
                          -
                          {Math.round(
                            (1 - product.price / product.originalPrice) * 100
                          )}
                          %
                        </span>
                      )}
                      <div className="aspect-square bg-[#F5F5F5] relative overflow-hidden">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-10 h-10 text-[#D4D4D4]"
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
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-[15px] font-semibold text-[#0A0A0A] mb-2 group-hover:text-[#DC2626] transition-colors">
                          {product.name}
                        </h4>
                        <div className="text-base font-bold text-[#DC2626]">
                          {product.originalPrice && (
                            <span className="block text-[#A3A3A3] text-xs font-medium line-through mb-0.5">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
