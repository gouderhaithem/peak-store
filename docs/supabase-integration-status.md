# Peak Store — Supabase integration status

Snapshot of where the Supabase integration stands and what still needs
work. Companion to [`supabase-schema.md`](./supabase-schema.md) (the
schema design) and [`../supabase/migrations/README.md`](../supabase/migrations/README.md)
(how to apply migrations).

> Current planning note: this file contains historical implementation
> context. For the latest 2026-05-22 audit and recommended order of work,
> use [`supabase-next-steps.md`](./supabase-next-steps.md).

---

## ✅ Done

### Infrastructure

- `@supabase/supabase-js` + `@supabase/ssr` installed.
- Three Supabase clients in `lib/supabase/`:
  - `client.ts` — browser client, used by Client Components for
    auth + admin writes (carries the session cookie).
  - `server.ts` — server client, used by Server Components / Server
    Actions / Route Handlers (reads cookies via `next/headers`).
  - `public.ts` — bare anonymous client, safe to import from either
    side. Used for public catalog reads where no session is needed.
- `proxy.ts` at the project root (Next.js 16 renamed `middleware.ts`
  → `proxy.ts`). Refreshes the auth session on every request.
- `next.config.ts` whitelists the Supabase storage host for `next/image`,
  derived from `NEXT_PUBLIC_SUPABASE_URL` so it follows the project.
- `.env.example` committed; real values in gitignored `.env.local`.

### Database

16 migrations applied (see `supabase/migrations/`):

| #    | File                       | What it sets up                                                                                                                   |
| ---- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 0001 | `enums.sql`                | Custom column types + shared `update_updated_at()` trigger function                                                               |
| 0002 | `profiles.sql`             | `profiles` table + auth-signup trigger + self-access RLS                                                                          |
| 0003 | `is_admin.sql`             | `is_admin()` helper + admin RLS policies on profiles                                                                              |
| 0004 | `wilayas.sql`              | Reference table for the 58 Algerian provinces                                                                                     |
| 0005 | `colors.sql`               | Shared color palette                                                                                                              |
| 0006 | `products.sql`             | `products` + `product_variants`                                                                                                   |
| 0007 | `orders.sql`               | `orders` + `order_items` + auto order number + initial stock triggers                                                             |
| 0008 | `views.sql`                | `customer_summary` view                                                                                                           |
| 0009 | `storage.sql`              | `product-images` bucket + public read / admin write policies                                                                      |
| 0010 | `seed.sql`                 | The 58 wilayas + 6 base colors                                                                                                    |
| 0011 | `product_images.sql`       | Per-product gallery table (one row per image, ordered)                                                                            |
| 0012 | `products_total_stock.sql` | Adds `products.total_stock` column                                                                                                |
| 0013 | `total_stock_trigger.sql`  | Keeps `products.total_stock` in sync with `product_variants`                                                                      |
| 0014 | `stock_transitions.sql`    | Unified deduct/restore on any status transition (replaces 0007's narrow triggers — covers `confirmed → shipped → cancelled` etc.) |
| 0015 | `home_content.sql`         | Editable homepage content (hero + 4 lifestyle sections) seeded with current i18n copy. Admin-editable via `/admin/home`.          |
| 0016 | `home_products_seed.sql`   | Starter Supabase products + variants for homepage product sections. Admin-editable images/prices/stock.                           |

All tables have RLS enabled. Reads on `products`, `wilayas`, `colors`,
`product_images`, and the `product-images` storage bucket are public.
All writes are gated by the `is_admin()` helper.

### Auth

- `lib/auth.tsx` rewritten on top of Supabase Auth. Same public surface
  (`<AuthProvider>`, `useSession()`, `User`, `UserRole`) so consumers
  didn't need to change.
- Sign in, sign up, sign out all flow through Supabase.
- Session restored on first paint via `getSession()`, kept fresh by
  the proxy + an `onAuthStateChange` subscription.
- Admin gating lives in `app/admin/layout.tsx` and reads
  `profiles.role` (not a hardcoded email anywhere).
- Bootstrap path is documented in `supabase/migrations/README.md`:
  sign up like a normal user, then run one `UPDATE profiles SET role
= 'admin'` query.

### Storefront reads

`lib/repository/supabase/products.ts` provides the live impl backing
`productsRepo`. Reads use the anonymous public client (`getPublicClient`)
so they're safe from both Server and Client Components. Methods done:

- `list(filters)` — gender / category / type / price range / sort / limit
- `findById(id)` — also loads the full gallery from `product_images`
- `findManyByIds(ids)` — preserves caller order
- `listFeatured(limit)` — derived from `is_new OR created_at > now()-30d`
- `listRelated(productId, limit)`
- `listLifestyle()` — still served from `lib/mockdata.ts` (decision: not
  a DB concern, see schema doc §2)
- `getSizeOptions(type)` — static, not a DB concern

DB-row → UI-shape mapping (centimes → DZD, `image_path` → public URL)
lives in this file and nowhere else.

### Admin product CRUD (partial)

| Action               | Status    | Notes                                                                                                                                                                                                                    |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Create               | ✅ live   | `productsRepo.create()`. Multi-image upload, slug auto-generated, atomic gallery insert (rolls back the product row if the gallery insert fails). Files only upload to storage when **Create** is clicked — cancel-safe. |
| Read (list / detail) | ✅ live   | Through the same public client used by the storefront. Detail page hydrates the gallery.                                                                                                                                 |
| Update               | ✅ live   | `productsRepo.update()`. Wipes and rebuilds the gallery to match the new desired state, deletes orphaned files from the storage bucket.                                                                                  |
| Delete               | ❌ mocked | Button toasts "coming with backend".                                                                                                                                                                                     |
| Duplicate            | ❌ mocked | Same.                                                                                                                                                                                                                    |

### Decisions recorded in `supabase-schema.md` §15

1. **Featured products — derived**, no `is_featured` column.
2. **Lifestyle sections — code**, no `cms_sections` table.
3. **Guest order rate limiting — deferred**, accept v1 risk.
4. **Stock reservation on confirm**, not on order create.
5. **Soft delete only** for products (`is_active = false`).

---

## 🚧 Still mocked

These keep working off `lib/mockdata.ts` / `lib/orders.ts` / `lib/mockCustomers.ts`
and `localStorage`. Functional, but not the source of truth a real shop needs.

| Surface                                     | Mock source                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Storefront PDP gallery (only shows primary) | `products.image_path` only — the extra gallery images sit unused in `product_images` |
| Orders (`ordersRepo`)                       | `lib/orders.ts` writes to `localStorage`                                             |
| Admin orders list / detail                  | Same mock store                                                                      |
| Admin customers list                        | `lib/mockCustomers.ts`                                                               |
| Admin product delete / duplicate            | `toast.info("coming with backend")`                                                  |
| Cart (`useCart.ts`)                         | `localStorage` — stays here intentionally (no DB cart in v1)                         |
| Favorites (`useFavorites.ts`)               | `localStorage` — same                                                                |

---

## 🎯 What's next (recommended order)

### 1. Storefront PDP gallery # already done

**Why first:** smallest. The data is already in `product_images`. Just
a UI change on the product detail page to render `product.images[]`
(thumb strip + swap-on-click), plus a small fallback to `product.image`
when the gallery is empty.

### 2. Admin product delete (+ duplicate)

**Why:** finishes catalog CRUD. Delete = `is_active = false` (soft, per
decision §5) plus cleaning up `product_images` rows and storage files.
Duplicate = read the source product, generate a new slug, insert a copy
of the row + gallery rows pointing at the same storage paths (or fresh
copies).

### 3. Variants editor on the product page

**Why:** stock currently lives on `product_variants`, and the form has
a single `stock` field that's ignored on insert. New products always
show "out of stock" until variants are added. Need a sub-section on the
product edit page: rows for (size × color) combinations with per-row
stock, SKU, optional image. Adding this also unblocks step 5.

### 4. Orders create flow

**Why:** the checkout currently writes to localStorage. Real impl:

- Switch `ordersRepo` to `supabaseOrdersRepo` (parallel to the products
  pattern).
- `create(input)` runs as a server action / route handler so the
  insert can validate cart totals server-side before writing.
- Handles guest checkout (`user_id IS NULL`) the same way as authed,
  per decision §3.
- Order items snapshot `product_name`, `unit_price_cents`, `size`,
  `color_name`, `color_hex` at write-time.
- Triggers from migration 0007 handle `subtotal_cents` recomputation
  and the stock decrement on admin confirm.

### 5. Admin orders view

**Why:** depends on #4. Read from `orders` + `order_items`, with status
transition buttons (`pending → confirmed → shipped → delivered`,
`* → cancelled`). Confirming triggers the DB stock decrement; cancelling
a confirmed order restores stock.

### 6. Admin customers view

**Why:** quickest of the remaining swaps. Read from `customer_summary`
view (which already inherits RLS via `WHERE auth.uid() = id OR
is_admin()`).

### 7. Production hardening (before the client takes over)

- **Re-enable email confirmation** in Supabase Auth settings (disabled
  for dev convenience).
- **Add a rate-limit / Turnstile** in front of guest orders (decision
  §3 deferred this — revisit before launch).
- **Configure SMTP** in Supabase so password resets and any future
  transactional emails actually send.
- **Lock down the service role key** rotation. Never commit it; the
  client will need their own copy in their own `.env`.
- Walk through the admin promotion process in
  `supabase/migrations/README.md` with the client at least once.

---

## Known gotchas worth flagging to the client

- **Next.js 16 renames `middleware.ts` → `proxy.ts`.** If anyone googles
  Next.js + Supabase tutorials, almost all of them still say
  `middleware.ts`. Our root file is `proxy.ts` and the function is
  exported as `proxy`. This is correct for Next 16.
- **`auth.users` is the source of truth for identity.** Don't manually
  insert into `profiles` — the `handle_new_auth_user` trigger does that
  on every signup. If a signup ever lands without a profile row, the
  trigger didn't fire (the migration didn't apply or got dropped).
- **Public-read storage bucket.** `product-images` is publicly readable
  by anyone with a URL. That's correct for product photos but means
  don't put anything sensitive in there.
- **Soft-deleted products still own their gallery files.** When delete
  is implemented (step 2), it'll set `is_active = false`. The storage
  files stay so historical order receipts can still show the right
  image. If the client ever wants to actually purge a product, that's
  a separate "hard delete" admin action we haven't built yet.

---

_Last updated: see git log on this file._
