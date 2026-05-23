"use server";

/**
 * Server action for placing orders.
 *
 * The browser submits cart items + shipping info. This action:
 *   1. Re-fetches each product / variant from the DB to snapshot the
 *      canonical name, price, and color — never trust client-sent values
 *      for billing.
 *   2. Resolves a variant per cart line (product × size, color is null
 *      until colors are editable). Lines without a matching variant fail
 *      the whole order — better to refuse than to ship a phantom SKU.
 *   3. Inserts the order, then the items. The DB trigger from migration
 *      0007 recomputes `subtotal_cents` from order_items; stock decrements
 *      only when an admin transitions pending → confirmed.
 *
 * Guest checkout: when the caller has no session, `user_id` is left null.
 * The RLS policy `orders_insert_self_or_guest` allows that. The receipt
 * lookup uses order number + phone through a server action instead of
 * opening guest orders to public reads.
 */

import { revalidatePath } from "next/cache";
import {
  createClient as createServerClient,
  createServiceClient,
} from "@/lib/supabase/server";
import type { CartItem } from "@/lib/useCart";
import type { OrderCustomer, OrderRecord, OrderStatus } from "@/lib/orders";
import { sendOrderNotification } from "@/lib/telegram";

export interface CreateOrderActionInput {
  items: CartItem[];
  customer: OrderCustomer;
}

export interface CreateOrderActionResult {
  ok: true;
  orderId: string;
  orderNumber: string;
  subtotalCents: number;
}

export interface CreateOrderActionError {
  ok: false;
  error: string;
  code:
    | "empty_cart"
    | "invalid_customer"
    | "product_missing"
    | "variant_missing"
    | "insert_failed";
}

interface ResolvedLine {
  productId: string;
  variantId: string;
  productName: string;
  size: string | null;
  colorName: string | null;
  colorHex: string | null;
  unitPriceCents: number;
  quantity: number;
}

interface VariantLookupRow {
  id: string;
  product_id: string;
  size: string | null;
  color_id: string | null;
  colors: { name_fr: string; hex: string } | { name_fr: string; hex: string }[] | null;
}

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

function validateCustomer(c: OrderCustomer): string | null {
  if (!c.fullName.trim()) return "full name required";
  if (!c.phone.trim() || !/^[+\d\s-]{8,}$/.test(c.phone.trim()))
    return "valid phone required";
  if (!c.wilaya?.trim()) return "wilaya required";
  if (!c.commune.trim()) return "commune required";
  if (!c.address.trim()) return "address required";
  return null;
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function mapOrder(row: OrderRow, items: OrderItemRow[]): OrderRecord {
  return {
    id: row.order_number,
    createdAt: row.created_at,
    items: items
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
      })),
    customer: {
      fullName: row.ship_full_name,
      phone: row.ship_phone,
      wilaya: row.ship_wilaya,
      commune: row.ship_commune,
      address: row.ship_address,
      note: row.ship_note ?? "",
    },
    subtotal: Math.round(row.subtotal_cents / 100),
    paymentMethod: row.payment_method,
    status: row.status,
  };
}

export async function createOrder(
  input: CreateOrderActionInput
): Promise<CreateOrderActionResult | CreateOrderActionError> {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Cart is empty", code: "empty_cart" };
  }

  const customerError = validateCustomer(input.customer);
  if (customerError) {
    return { ok: false, error: customerError, code: "invalid_customer" };
  }

  // Sanitize quantities. Cart hook already enforces > 0, but client state
  // is untrusted at the boundary.
  const items = input.items
    .filter((it) => Number.isInteger(it.quantity) && it.quantity > 0)
    .map((it) => ({
      productId: String(it.productId),
      size: it.size,
      colorId: it.colorId ?? null,
      quantity: Math.min(Math.floor(it.quantity), 99),
    }));

  if (items.length === 0) {
    return { ok: false, error: "Cart is empty", code: "empty_cart" };
  }

  // Service-role client: bypasses RLS so guest orders aren't blocked when
  // the publishable-key session doesn't propagate. Safe here because (a)
  // this is a Server Action, never bundled to the browser, and (b) every
  // value below is either validated above or pinned to a server-known
  // constant (user_id, status, payment_method).
  const authClient = await createServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const supabase = createServiceClient();

  // 1. Pull current product rows for every cart line. Active filter mirrors
  //    what the storefront would have shown — refuse to bill for products
  //    that were soft-deleted between cart-add and checkout.
  const productIds = Array.from(new Set(items.map((it) => it.productId)));
  const { data: productRows, error: prodErr } = await supabase
    .from("products")
    .select("id,name,price_cents,is_active")
    .in("id", productIds);

  if (prodErr) {
    return { ok: false, error: prodErr.message, code: "product_missing" };
  }

  const productsById = new Map(
    (productRows ?? []).map((r) => [r.id as string, r])
  );

  for (const it of items) {
    const row = productsById.get(it.productId);
    if (!row || row.is_active === false) {
      return {
        ok: false,
        error: `Product no longer available`,
        code: "product_missing",
      };
    }
  }

  // 2. Resolve variants. Color is optional: size-only products use
  //    color_id null, color products require the selected color id.
  const sizesByProduct = new Map<string, Set<string | null>>();
  for (const it of items) {
    if (!sizesByProduct.has(it.productId)) {
      sizesByProduct.set(it.productId, new Set());
    }
    sizesByProduct.get(it.productId)!.add(it.size);
  }

  const variantQueries = await Promise.all(
    Array.from(sizesByProduct.entries()).map(([productId]) =>
      supabase
        .from("product_variants")
        .select("id,product_id,size,color_id,colors(name_fr,hex)")
        .eq("product_id", productId)
        .eq("is_active", true)
    )
  );

  const variantsBySig = new Map<string, VariantLookupRow>();
  for (const q of variantQueries) {
    if (q.error) {
      return { ok: false, error: q.error.message, code: "variant_missing" };
    }
    for (const v of q.data ?? []) {
      variantsBySig.set(
        `${v.product_id as string}|${v.size as string | null}|${(v.color_id as string | null) ?? ""}`,
        v as VariantLookupRow
      );
    }
  }

  const resolved: ResolvedLine[] = [];
  for (const it of items) {
    const variant = variantsBySig.get(
      `${it.productId}|${it.size}|${it.colorId ?? ""}`
    );
    if (!variant) {
      return {
        ok: false,
        error: `Selected variant is no longer available`,
        code: "variant_missing",
      };
    }
    const product = productsById.get(it.productId)!;
    const color = Array.isArray(variant.colors)
      ? variant.colors[0]
      : variant.colors;
    resolved.push({
      productId: it.productId,
      variantId: variant.id,
      productName: product.name as string,
      size: it.size,
      colorName: color?.name_fr ?? null,
      colorHex: color?.hex ?? null,
      unitPriceCents: product.price_cents as number,
      quantity: it.quantity,
    });
  }

  // 3. Insert the order header. Authenticated users keep ownership through
  //    user_id; guests are verified later by order number + phone for the
  //    receipt view. order_number is set by the migration 0007 trigger;
  //    subtotal_cents is computed by the recompute trigger after items
  //    insert.
  const c = input.customer;
  const { data: newOrder, error: ordErr } = await supabase
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      status: "pending",
      payment_method: "cod",
      subtotal_cents: 0,
      ship_full_name: c.fullName.trim(),
      ship_phone: c.phone.trim(),
      ship_wilaya: c.wilaya.trim(),
      ship_commune: c.commune.trim(),
      ship_address: c.address.trim(),
      ship_note: c.note?.trim() || null,
    })
    .select("id,order_number")
    .single();

  if (ordErr || !newOrder) {
    return {
      ok: false,
      error: ordErr?.message ?? "Order insert failed",
      code: "insert_failed",
    };
  }

  // 4. Insert the line items. The subtotal trigger fires after this and
  //    populates orders.subtotal_cents from the actual line totals — so
  //    we re-read the order to return the canonical value.
  const itemRows = resolved.map((r) => ({
    order_id: newOrder.id as string,
    product_id: r.productId,
    variant_id: r.variantId,
    product_name: r.productName,
    size: r.size,
    color_name: r.colorName,
    color_hex: r.colorHex,
    unit_price_cents: r.unitPriceCents,
    quantity: r.quantity,
  }));

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(itemRows);

  if (itemsErr) {
    // Roll back the empty order row so we don't leave $0 orphans.
    await supabase.from("orders").delete().eq("id", newOrder.id);
    return {
      ok: false,
      error: itemsErr.message,
      code: "insert_failed",
    };
  }

  const { data: refreshed } = await supabase
    .from("orders")
    .select("subtotal_cents")
    .eq("id", newOrder.id)
    .single();

  // Bust the admin orders list cache so a fresh admin visit sees the new
  // order without a hard refresh.
  revalidatePath("/admin/orders");

  const subtotalCents = (refreshed?.subtotal_cents as number) ?? 0;

  // Fire-and-forget Telegram notification — never blocks or fails the order.
  void sendOrderNotification({
    orderNumber: newOrder.order_number as string,
    customerName: c.fullName.trim(),
    phone: c.phone.trim(),
    wilaya: c.wilaya.trim(),
    commune: c.commune.trim(),
    address: c.address.trim(),
    note: c.note?.trim() || null,
    items: resolved.map((r) => ({
      name: r.productName,
      size: r.size,
      colorName: r.colorName,
      quantity: r.quantity,
      unitPriceCents: r.unitPriceCents,
    })),
    subtotalCents,
  });

  return {
    ok: true,
    orderId: newOrder.id as string,
    orderNumber: newOrder.order_number as string,
    subtotalCents,
  };
}

export async function findGuestOrderReceipt(
  orderNumber: string,
  phone: string
): Promise<OrderRecord | null> {
  const order = orderNumber.trim();
  const phoneKey = normalizePhone(phone);
  if (!/^PEAK-\d{6}-\d{4}$/.test(order) || phoneKey.length < 8) {
    return null;
  }

  const supabase = createServiceClient();
  const { data: orderData, error: orderErr } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("order_number", order)
    .maybeSingle();

  if (orderErr || !orderData) return null;
  const row = orderData as OrderRow;
  if (normalizePhone(row.ship_phone) !== phoneKey) return null;

  const { data: itemsData, error: itemsErr } = await supabase
    .from("order_items")
    .select(ORDER_ITEM_COLUMNS)
    .eq("order_id", row.id);
  if (itemsErr) return null;

  return mapOrder(row, (itemsData as OrderItemRow[]) ?? []);
}
