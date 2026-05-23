"use client";

import { useCallback, useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  size: string | null;
  colorId?: string | null;
  colorName?: string | null;
  colorHex?: string | null;
  productName?: string | null;
  unitPrice?: number | null;
  quantity: number;
}

const STORAGE_KEY = "peak:cart";
const EVENT_NAME = "peak:cart:changed";
const OPEN_EVENT = "peak:cart:open";

export function openCartDrawer(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export const CART_OPEN_EVENT = OPEN_EVENT;

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    (v.size === null || typeof v.size === "string") &&
    (v.colorId === undefined ||
      v.colorId === null ||
      typeof v.colorId === "string") &&
    (v.colorName === undefined ||
      v.colorName === null ||
      typeof v.colorName === "string") &&
    (v.colorHex === undefined ||
      v.colorHex === null ||
      typeof v.colorHex === "string") &&
    (v.productName === undefined ||
      v.productName === null ||
      typeof v.productName === "string") &&
    (v.unitPrice === undefined ||
      v.unitPrice === null ||
      typeof v.unitPrice === "number") &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  );
}

function readStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function normalizeItem(item: CartItem): CartItem {
  return { ...item, colorId: item.colorId ?? null };
}

function sameItem(
  a: CartItem,
  b: { productId: string; size: string | null; colorId?: string | null }
) {
  return (
    a.productId === b.productId &&
    a.size === b.size &&
    (a.colorId ?? null) === (b.colorId ?? null)
  );
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setItems(readStorage().map(normalizeItem));
    const timer = window.setTimeout(() => {
      sync();
      setHydrated(true);
    }, 0);
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback(
    (
      productId: string,
      size: string | null,
      quantity: number = 1,
      color?: { id: string; name: string; hex: string } | null
    ) => {
      const current = readStorage().map(normalizeItem);
      const colorId = color?.id ?? null;
      const existingIdx = current.findIndex((it) =>
        sameItem(it, { productId, size, colorId })
      );
      let next: CartItem[];
      if (existingIdx >= 0) {
        next = current.map((it, i) =>
          i === existingIdx
            ? { ...it, quantity: it.quantity + quantity }
            : it
        );
      } else {
        next = [
          ...current,
          {
            productId,
            size,
            colorId,
            colorName: color?.name ?? null,
            colorHex: color?.hex ?? null,
            quantity,
          },
        ];
      }
      writeStorage(next);
      setItems(next);
    },
    []
  );

  const remove = useCallback((productId: string, size: string | null, colorId?: string | null) => {
    const current = readStorage().map(normalizeItem);
    const next = current.filter((it) => !sameItem(it, { productId, size, colorId }));
    writeStorage(next);
    setItems(next);
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string | null, quantity: number, colorId?: string | null) => {
      if (quantity < 1) {
        // delegate to remove
        const current = readStorage().map(normalizeItem);
        const next = current.filter((it) => !sameItem(it, { productId, size, colorId }));
        writeStorage(next);
        setItems(next);
        return;
      }
      const current = readStorage().map(normalizeItem);
      const next = current.map((it) =>
        sameItem(it, { productId, size, colorId }) ? { ...it, quantity } : it
      );
      writeStorage(next);
      setItems(next);
    },
    []
  );

  const clear = useCallback(() => {
    writeStorage([]);
    setItems([]);
  }, []);

  const count = items.reduce((sum, it) => sum + it.quantity, 0);

  return { items, add, remove, updateQuantity, clear, count, hydrated };
}
