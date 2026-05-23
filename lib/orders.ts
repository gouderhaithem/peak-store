"use client";

import type { CartItem } from "./useCart";

export interface OrderCustomer {
  fullName: string;
  phone: string;
  wilaya: string; // wilaya code
  commune: string;
  address: string;
  note: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderRecord {
  id: string;
  createdAt: string; // ISO timestamp
  items: CartItem[];
  customer: OrderCustomer;
  subtotal: number;
  paymentMethod: "cod";
  status: OrderStatus;
}

const STORAGE_KEY = "peak:orders";

function readAll(): OrderRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isOrderRecord);
  } catch {
    return [];
  }
}

function isOrderRecord(value: unknown): value is OrderRecord {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.createdAt === "string" &&
    Array.isArray(v.items) &&
    typeof v.customer === "object" &&
    typeof v.subtotal === "number"
  );
}

function writeAll(orders: OrderRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function generateOrderId(): string {
  // PEAK-YYMMDD-XXXX
  const now = new Date();
  const stamp =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PEAK-${stamp}-${rand}`;
}

export function saveOrder(input: {
  items: CartItem[];
  customer: OrderCustomer;
  subtotal: number;
}): OrderRecord {
  const record: OrderRecord = {
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    items: input.items,
    customer: input.customer,
    subtotal: input.subtotal,
    paymentMethod: "cod",
    status: "pending",
  };
  const all = readAll();
  writeAll([record, ...all]);
  return record;
}

export function getOrder(id: string): OrderRecord | undefined {
  return readAll().find((o) => o.id === id);
}

export function listOrders(): OrderRecord[] {
  return readAll();
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus
): OrderRecord | undefined {
  const all = readAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return undefined;
  const updated: OrderRecord = { ...all[idx], status };
  const next = [...all.slice(0, idx), updated, ...all.slice(idx + 1)];
  writeAll(next);
  return updated;
}

export function updateOrdersStatus(
  ids: string[],
  status: OrderStatus
): number {
  const set = new Set(ids);
  const all = readAll();
  let count = 0;
  const next = all.map((o) => {
    if (set.has(o.id)) {
      count += 1;
      return { ...o, status };
    }
    return o;
  });
  if (count > 0) writeAll(next);
  return count;
}

export function deleteOrders(ids: string[]): number {
  const set = new Set(ids);
  const all = readAll();
  const next = all.filter((o) => !set.has(o.id));
  const removed = all.length - next.length;
  if (removed > 0) writeAll(next);
  return removed;
}
