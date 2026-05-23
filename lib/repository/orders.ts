/**
 * Orders repository.
 *
 * Currently persists to localStorage via `lib/orders.ts`. When Supabase lands,
 * implement against the `orders` + `order_items` tables and switch the export
 * below — UI code that imports `ordersRepo` does not change.
 */

import {
  getOrder as getLocalOrder,
  listOrders as listLocalOrders,
  saveOrder as saveLocalOrder,
  updateOrderStatus as updateLocalOrderStatus,
  updateOrdersStatus as updateLocalOrdersStatus,
  deleteOrders as deleteLocalOrders,
  type OrderCustomer,
  type OrderRecord,
  type OrderStatus,
} from "@/lib/orders";
import { ensureOrdersSeeded as ensureMockSeeded } from "@/lib/mockOrders";
import type { CartItem } from "@/lib/useCart";

export interface CreateOrderInput {
  items: CartItem[];
  customer: OrderCustomer;
  subtotal: number;
}

export interface OrdersRepository {
  create(input: CreateOrderInput): Promise<OrderRecord>;
  findById(id: string): Promise<OrderRecord | null>;
  listMine(): Promise<OrderRecord[]>;
  list(): Promise<OrderRecord[]>;
  updateStatus(id: string, status: OrderStatus): Promise<OrderRecord | null>;
  updateManyStatus(ids: string[], status: OrderStatus): Promise<number>;
  deleteMany(ids: string[]): Promise<number>;
  ensureSeeded(): Promise<void>;
}

export const mockOrdersRepo: OrdersRepository = {
  async create(input) {
    return saveLocalOrder(input);
  },
  async findById(id) {
    return getLocalOrder(id) ?? null;
  },
  async listMine() {
    return listLocalOrders();
  },
  async list() {
    return listLocalOrders();
  },
  async updateStatus(id, status) {
    return updateLocalOrderStatus(id, status) ?? null;
  },
  async updateManyStatus(ids, status) {
    return updateLocalOrdersStatus(ids, status);
  },
  async deleteMany(ids) {
    return deleteLocalOrders(ids);
  },
  async ensureSeeded() {
    ensureMockSeeded();
  },
};

import { supabaseOrdersRepo } from "./supabase/orders";

// Real impl. The mock above is kept exported for tests / offline dev —
// swap the binding below to use it.
export const ordersRepo: OrdersRepository = supabaseOrdersRepo;
