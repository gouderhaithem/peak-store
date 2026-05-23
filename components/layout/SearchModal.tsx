"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { productsRepo } from "@/lib/repository";
import { formatPrice } from "@/lib/mockdata";
import type { Product } from "@/lib/mockdata";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSearched(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await productsRepo.search(query, 8);
        setResults(data);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (!open) return null;

  const shopUrl = `/shop?q=${encodeURIComponent(query.trim())}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-xl">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 sm:px-6 h-16 border-b border-[#E5E5E5]">
          <Search className="w-5 h-5 text-[#737373] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("nav.searchPlaceholder")}
            className="flex-1 text-base text-[#0A0A0A] placeholder:text-[#A3A3A3] bg-transparent outline-none"
          />
          {loading && (
            <Loader2 className="w-4 h-4 text-[#737373] animate-spin shrink-0" />
          )}
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#0A0A0A] transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* No results */}
            {searched && results.length === 0 && !loading && (
              <p className="text-sm text-[#737373] py-6 text-center">
                {t("nav.searchNoResults").replace("{query}", query.trim())}
              </p>
            )}

            {/* Result list */}
            {results.length > 0 && (
              <>
                <div className="space-y-1">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/shop/${product.id}`}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-xl hover:bg-[#FAFAFA] transition-colors group"
                      )}
                    >
                      <div className="w-14 h-14 bg-[#F5F5F5] rounded-lg overflow-hidden shrink-0">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0A0A0A] truncate group-hover:text-[#DC2626] transition-colors">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#737373] capitalize">
                          {product.type}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#0A0A0A] shrink-0">
                        {formatPrice(product.price)}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* View all link */}
                {results.length >= 8 && (
                  <div className="pt-3 border-t border-[#E5E5E5] mt-3">
                    <Link
                      href={shopUrl}
                      onClick={onClose}
                      className="block text-center text-sm font-medium text-[#DC2626] hover:underline py-1"
                    >
                      {t("nav.searchViewAll")} →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
