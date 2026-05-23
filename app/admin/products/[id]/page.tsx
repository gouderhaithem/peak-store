"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { productsRepo } from "@/lib/repository";
import type { Product } from "@/lib/mockdata";
import { useTranslations } from "@/lib/i18n";
import ProductForm from "@/components/admin/ProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    productsRepo.findById(id).then((found) => {
      if (!cancelled) setProduct(found);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (product === undefined) {
    return <div className="min-h-[40vh]" />;
  }

  if (product === null) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 sm:p-10 text-center max-w-md mx-auto">
        <h1 className="font-heading text-2xl font-bold text-[#0A0A0A] mb-3">
          {t("product.productNotFound")}
        </h1>
        <p className="text-[#525252] mb-6">
          {t("product.productNotFoundDesc")}
        </p>
        <Link
          href="/admin/products"
          className="h-11 px-6 inline-flex items-center bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("admin.products")}
        </Link>
      </div>
    );
  }

  return <ProductForm mode="edit" productId={id} initialProduct={product} />;
}
