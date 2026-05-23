/**
 * Supabase implementation of OrdersRepository.
 *
 * Splits responsibilities:
 *   - create() delegates to the `createOrder` server action so cart totals
 *     and variant resolution happen with full RLS context server-side.
 *   - Everything else (reads, status updates, deletes) uses the browser
 *     client. Customers see their own orders; admins see all — both
 *     enforced by RLS, not by this code.
 *
 * The UI-facing OrderRecord shape (defined in lib/orders.ts for historical
 * reasons) is mapped here from the snake_case DB rows.
 */

import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/useCart";
import type {
  OrderCustomer,
  OrderRecord,
  OrderStatus,
} from "@/lib/orders";
import type {
  CreateOrderInput,
  OrdersRepository,
} from "@/lib/repository/orders";
import { createOrder as createOrderAction } from "@/app/actions/orders";

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  payment_method: "cod";
  subtotal_cents: number;
  ship_full_name: string;
  ship_phone: string;
  ship_wilaya: string;
  ship_commune: string;
  ship_address: string;
  ship_note: string | null;
  created_at: string;
}

interface OrderItemRow {
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  unit_price_cents: number;
  quantity: number;
}

const ORDER_COLUMNS =
  "id,order_number,user_id,status,payment_method,subtotal_cents,ship_full_name,ship_phone,ship_wilaya,ship_commune,ship_address,ship_note,created_at";

const ORDER_ITEM_COLUMNS =
  "order_id,product_id,variant_id,product_name,size,color_name,color_hex,unit_price_cents,quantity";

function mapOrder(row: OrderRow, items: OrderItemRow[]): OrderRecord {
  const customer: OrderCustomer = {
    fullName: row.ship_full_name,
    phone: row.ship_phone,
    wilaya: row.ship_wilaya,
    commune: row.ship_commune,
    address: row.ship_address,
    note: row.ship_note ?? "",
  };
  const cartItems: CartItem[] = items
    .filter((it) => it.order_id === row.id)
    .map((it) => ({
      productId: it.product_id ?? "",
      size: it.size,
      colorId: null,
      colorName: it.color_name,
      colorHex: it.color_hex,
      productName: it.product_name,
      unitPrice: Math.round(it.unit_price_cents / 100),
      quantity: it.quantity,
    }));
  return {
    // UI keys orders by their human-readable number rather than the UUID
    // — order tracking links, toast messages, and breadcrumb already use
    // PEAK-YYMMDD-NNNN. The UUID stays internal to the DB.
    id: row.order_number,
    createdAt: row.created_at,
    items: cartItems,
    customer,
    subtotal: Math.round(row.subtotal_cents / 100),
    paymentMethod: row.payment_method,
    status: row.status,
  };
}

async function fetchByOrderNumber(
  client: ReturnType<typeof createBrowserSupabase>,
  orderNumber: string
): Promise<OrderRecord | null> {
  const { data: orderData, error: orderErr } = await client
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (orderErr) throw orderErr;
  if (!orderData) return null;

  const { data: itemsData, error: itemsErr } = await client
    .from("order_items")
    .select(ORDER_ITEM_COLUMNS)
    .eq("order_id", (orderData as OrderRow).id);
  if (itemsErr) throw itemsErr;

  return mapOrder(orderData as OrderRow, (itemsData as OrderItemRow[]) ?? []);
}

async function listOrders(
  client: ReturnType<typeof createBrowserSupabase>,
  filter: { mine: boolean }
): Promise<OrderRecord[]> {
  let query = client
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false });

  if (filter.mine) {
    // RLS already restricts the row set; this extra filter is harmless and
    // makes the query plan explicit.
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return [];
    query = query.eq("user_id", user.id);
  }

  const { data: orderRows, error: orderErr } = await query;
  if (orderErr) throw orderErr;
  if (!orderRows || orderRows.length === 0) return [];

  const ids = (orderRows as OrderRow[]).map((r) => r.id);
  const { data: itemRows, error: itemErr } = await client
    .from("order_items")
    .select(ORDER_ITEM_COLUMNS)
    .in("order_id", ids);
  if (itemErr) throw itemErr;

  const items = (itemRows as OrderItemRow[]) ?? [];
  return (orderRows as OrderRow[]).map((r) => mapOrder(r, items));
}

export const supabaseOrdersRepo: OrdersRepository = {
  async create(input: CreateOrderInput) {
    const result = await createOrderAction({
      items: input.items,
      customer: input.customer,
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    // The action only returns identifiers + the recomputed subtotal; the
    // UI's success-page flow keys off `record.id`, which we map to the
    // order number so it stays consistent with the local impl.
    return {
      id: result.orderNumber,
      createdAt: new Date().toISOString(),
      items: input.items,
      customer: input.customer,
      subtotal: Math.round(result.subtotalCents / 100),
      paymentMethod: "cod",
      status: "pending",
    };
  },

  async findById(id) {
    const client = createBrowserSupabase();
    return fetchByOrderNumber(client, id);
  },

  async listMine() {
    const client = createBrowserSupabase();
    return listOrders(client, { mine: true });
  },

  async list() {
    const client = createBrowserSupabase();
    return listOrders(client, { mine: false });
  },

  async updateStatus(id, status) {
    const client = createBrowserSupabase();
    // `id` is the order number; resolve to UUID first so the update
    // hits the indexed primary key.
    const { data: existing, error: findErr } = await client
      .from("orders")
      .select("id")
      .eq("order_number", id)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!existing) return null;

    const { error: updErr } = await client
      .from("orders")
      .update({ status })
      .eq("id", (existing as { id: string }).id);
    if (updErr) throw updErr;

    return fetchByOrderNumber(client, id);
  },

  async updateManyStatus(ids, status) {
    if (ids.length === 0) return 0;
    const client = createBrowserSupabase();
    const { data: rows, error: findErr } = await client
      .from("orders")
      .select("id")
      .in("order_number", ids);
    if (findErr) throw findErr;
    const uuids = (rows ?? []).map((r) => r.id as string);
    if (uuids.length === 0) return 0;

    const { error: updErr } = await client
      .from("orders")
      .update({ status })
      .in("id", uuids);
    if (updErr) throw updErr;
    return uuids.length;
  },

  async deleteMany(ids) {
    if (ids.length === 0) return 0;
    const client = createBrowserSupabase();
    const { data: rows, error: findErr } = await client
      .from("orders")
      .select("id")
      .in("order_number", ids);
    if (findErr) throw findErr;
    const uuids = (rows ?? []).map((r) => r.id as string);
    if (uuids.length === 0) return 0;

    // order_items cascade via the foreign key from migration 0007.
    const { error: delErr } = await client
      .from("orders")
      .delete()
      .in("id", uuids);
    if (delErr) throw delErr;
    return uuids.length;
  },

  async ensureSeeded() {
    // No-op against Supabase — seeding is handled by migration 0010 and
    // any one-off admin SQL the client runs themselves.
  },
};
