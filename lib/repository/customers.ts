/**
 * Customers repository.
 *
 * Reads from the `customer_summary` Supabase view (migration 0008).
 * The mock implementation is kept for local/offline dev — switch the
 * export at the bottom to toggle.
 */

import { MOCK_CUSTOMERS, type MockCustomer } from "@/lib/mockCustomers";
import { supabaseCustomersRepo } from "./supabase/customers";

export type Customer = MockCustomer;

export interface CustomerFilters {
  query?: string;
  wilaya?: string;
  sortBy?: "recent" | "name" | "spent" | "orders";
  limit?: number;
}

export interface CustomersRepository {
  list(filters?: CustomerFilters): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
}

function applyFilters(rows: Customer[], f: CustomerFilters): Customer[] {
  let out = rows;
  if (f.query?.trim()) {
    const q = f.query.trim().toLowerCase();
    out = out.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))
    );
  }
  if (f.wilaya) {
    out = out.filter((c) => c.wilaya === f.wilaya);
  }
  if (f.sortBy) {
    out = [...out].sort((a, b) => {
      if (f.sortBy === "name") return a.fullName.localeCompare(b.fullName);
      if (f.sortBy === "spent") return b.totalSpent - a.totalSpent;
      if (f.sortBy === "orders") return b.ordersCount - a.ordersCount;
      if (f.sortBy === "recent") return b.joinedAt.localeCompare(a.joinedAt);
      return 0;
    });
  }
  if (typeof f.limit === "number") out = out.slice(0, f.limit);
  return out;
}

export const mockCustomersRepo: CustomersRepository = {
  async list(filters = {}) {
    return applyFilters(MOCK_CUSTOMERS, filters);
  },
  async findById(id) {
    return MOCK_CUSTOMERS.find((c) => c.id === id) ?? null;
  },
};

export const customersRepo: CustomersRepository = supabaseCustomersRepo;
