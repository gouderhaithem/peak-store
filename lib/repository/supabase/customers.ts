/**
 * Supabase implementation of CustomersRepository.
 *
 * Reads from the `customer_summary` view (migration 0008). That view
 * joins profiles + auth.users + orders and is RLS-scoped so admins see
 * every row while regular users see only themselves.
 *
 * All reads go through the browser client so the admin session cookie
 * is forwarded and `is_admin()` evaluates to true inside the view.
 */

import { createClient } from "@/lib/supabase/client";
import type { Customer, CustomerFilters, CustomersRepository } from "@/lib/repository/customers";

interface CustomerSummaryRow {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_color: string | null;
  joined_at: string;
  orders_count: number;
  total_spent_cents: number;
  preferred_wilaya: string | null;
}

const AVATAR_COLORS = [
  "#0A0A0A", "#DC2626", "#171717", "#7c2d12",
  "#1d4ed8", "#0f766e", "#525252", "#7e22ce",
  "#b45309", "#15803d",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function mapRow(row: CustomerSummaryRow): Customer {
  return {
    id: row.id,
    fullName: row.full_name?.trim() || row.email.split("@")[0],
    email: row.email,
    phone: row.phone ?? "",
    wilaya: row.preferred_wilaya ?? "",
    ordersCount: row.orders_count,
    totalSpent: Math.round(row.total_spent_cents / 100),
    joinedAt: row.joined_at,
    avatarColor: row.avatar_color ?? colorForId(row.id),
  };
}

export const supabaseCustomersRepo: CustomersRepository = {
  async list(filters: CustomerFilters = {}) {
    const supabase = createClient();

    let q = supabase
      .from("customer_summary")
      .select("id,full_name,email,phone,avatar_color,joined_at,orders_count,total_spent_cents,preferred_wilaya");

    if (filters.wilaya) {
      q = q.eq("preferred_wilaya", filters.wilaya);
    }

    switch (filters.sortBy) {
      case "name":
        q = q.order("full_name", { ascending: true });
        break;
      case "spent":
        q = q.order("total_spent_cents", { ascending: false });
        break;
      case "orders":
        q = q.order("orders_count", { ascending: false });
        break;
      case "recent":
      default:
        q = q.order("joined_at", { ascending: false });
    }

    if (typeof filters.limit === "number") {
      q = q.limit(filters.limit);
    }

    const { data, error } = await q;
    if (error) throw error;

    let rows = (data ?? []).map((r) => mapRow(r as CustomerSummaryRow));

    if (filters.query?.trim()) {
      const term = filters.query.trim().toLowerCase();
      rows = rows.filter(
        (c) =>
          c.fullName.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.phone.replace(/\s+/g, "").includes(term.replace(/\s+/g, ""))
      );
    }

    return rows;
  },

  async findById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customer_summary")
      .select("id,full_name,email,phone,avatar_color,joined_at,orders_count,total_spent_cents,preferred_wilaya")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapRow(data as CustomerSummaryRow);
  },
};
