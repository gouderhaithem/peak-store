"use client";

import type { OrderRecord } from "./orders";

const SEED_FLAG_KEY = "peak:orders:seeded";
const STORAGE_KEY = "peak:orders";

// Realistic mock orders covering a variety of statuses, dates, and items.
// Items reference product IDs from `lib/mockdata.ts`.
export const MOCK_ORDERS: OrderRecord[] = [
  {
    id: "PEAK-260514-2841",
    createdAt: "2026-05-14T09:12:00Z",
    items: [
      { productId: "shop-1", size: "42", quantity: 1 },
      { productId: "shop-8", size: "M", quantity: 2 },
    ],
    customer: {
      fullName: "Mohamed Brahimi",
      phone: "0555 102 304",
      wilaya: "39",
      commune: "El Oued Centre",
      address: "Rue des Frères Mihoubi, Bât B, n° 12",
      note: "Sonner deux fois, merci",
    },
    subtotal: 18900,
    paymentMethod: "cod",
    status: "pending",
  },
  {
    id: "PEAK-260513-9302",
    createdAt: "2026-05-13T15:48:00Z",
    items: [{ productId: "shop-2", size: "43", quantity: 1 }],
    customer: {
      fullName: "Lina Saadi",
      phone: "0660 423 991",
      wilaya: "16",
      commune: "Hydra",
      address: "Lotissement Beau-Soleil, villa 28",
      note: "",
    },
    subtotal: 13500,
    paymentMethod: "cod",
    status: "confirmed",
  },
  {
    id: "PEAK-260512-5719",
    createdAt: "2026-05-12T11:30:00Z",
    items: [
      { productId: "shop-7", size: "44", quantity: 1 },
      { productId: "shop-10", size: "L", quantity: 1 },
    ],
    customer: {
      fullName: "Yacine Bensalem",
      phone: "0770 558 010",
      wilaya: "31",
      commune: "Es Sénia",
      address: "Cité 220 logements, bât A6, n° 4",
      note: "Appeler avant la livraison",
    },
    subtotal: 21000,
    paymentMethod: "cod",
    status: "shipped",
  },
  {
    id: "PEAK-260510-4108",
    createdAt: "2026-05-10T18:05:00Z",
    items: [
      { productId: "shop-9", size: "41", quantity: 1 },
      { productId: "shop-5", size: "XL", quantity: 1 },
    ],
    customer: {
      fullName: "Amel Cherif",
      phone: "0540 211 008",
      wilaya: "25",
      commune: "Constantine Centre",
      address: "Rue Larbi Ben M'hidi, immeuble 7",
      note: "",
    },
    subtotal: 16750,
    paymentMethod: "cod",
    status: "delivered",
  },
  {
    id: "PEAK-260508-7723",
    createdAt: "2026-05-08T10:21:00Z",
    items: [{ productId: "shop-6", size: "38", quantity: 1 }],
    customer: {
      fullName: "Rayan Mansouri",
      phone: "0670 980 223",
      wilaya: "39",
      commune: "Robbah",
      address: "Cité 200 logements, bât C3, n° 22",
      note: "Cadeau pour mon fils",
    },
    subtotal: 7500,
    paymentMethod: "cod",
    status: "delivered",
  },
  {
    id: "PEAK-260507-3914",
    createdAt: "2026-05-07T14:12:00Z",
    items: [
      { productId: "shop-3", size: "42", quantity: 1 },
      { productId: "shop-11", size: "39", quantity: 1 },
      { productId: "shop-12", size: "S", quantity: 1 },
    ],
    customer: {
      fullName: "Sara Bouzid",
      phone: "0555 770 421",
      wilaya: "06",
      commune: "Béjaïa",
      address: "Quartier Aamriw, villa 18",
      note: "",
    },
    subtotal: 25800,
    paymentMethod: "cod",
    status: "confirmed",
  },
  {
    id: "PEAK-260505-1156",
    createdAt: "2026-05-05T08:55:00Z",
    items: [{ productId: "shop-4", size: "43", quantity: 2 }],
    customer: {
      fullName: "Walid Belkacem",
      phone: "0660 119 832",
      wilaya: "05",
      commune: "Batna Centre",
      address: "Rue de la Liberté, n° 34",
      note: "",
    },
    subtotal: 22400,
    paymentMethod: "cod",
    status: "cancelled",
  },
  {
    id: "PEAK-260503-8462",
    createdAt: "2026-05-03T16:40:00Z",
    items: [
      { productId: "shop-1", size: "41", quantity: 1 },
      { productId: "shop-8", size: "L", quantity: 1 },
      { productId: "shop-5", size: "M", quantity: 1 },
    ],
    customer: {
      fullName: "Karim Hadjaj",
      phone: "0550 887 121",
      wilaya: "23",
      commune: "Annaba Centre",
      address: "Boulevard du 1er Novembre, n° 76",
      note: "Livraison après 17h svp",
    },
    subtotal: 21650,
    paymentMethod: "cod",
    status: "shipped",
  },
];

/**
 * Seeds mock orders into localStorage on first admin load. Subsequent loads
 * are idempotent — once the seed flag is set, customer-created orders stack
 * on top of the seeded set without duplication.
 */
export function ensureOrdersSeeded(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG_KEY) === "1") return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const existing: OrderRecord[] = raw ? (JSON.parse(raw) as OrderRecord[]) : [];
    // Insert mock orders at the END so any user-created orders stay at the top
    // (matches how `saveOrder` prepends new records).
    const seen = new Set(existing.map((o) => o.id));
    const newcomers = MOCK_ORDERS.filter((o) => !seen.has(o.id));
    const merged = [...existing, ...newcomers];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.localStorage.setItem(SEED_FLAG_KEY, "1");
  } catch {
    // ignore — localStorage may be unavailable / quota exceeded
  }
}
