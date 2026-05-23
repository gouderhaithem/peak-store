# Peak Store — Project Status

> Last updated: 2026-05-22  
> Stack: Next.js 16 (App Router) · React 19 · Supabase · TypeScript 5 · Tailwind CSS 4  
> Migrations applied: 0001 → 0017

---

## What Was Built (Full History)

### Infrastructure & Foundation
- Next.js 16 project with App Router, TypeScript strict mode, Tailwind CSS 4
- 3 Supabase clients: `public.ts` (catalog reads), `client.ts` (auth + admin writes), `server.ts` (server actions)
- `proxy.ts` session refresh on every request (Next.js 16 convention — not `middleware.ts`)
- `.env.example` committed; real keys in gitignored `.env.local`
- `next/image` whitelisted for Unsplash + Supabase storage domains
- Repository pattern (`lib/repository/`) — UI code imports interfaces; Supabase vs mock swapped in one place

### Database Schema (17 migrations)
| # | Migration | What it adds |
|---|-----------|-------------|
| 0001 | `enums.sql` | Custom enums (gender, type, category, status, role) + `update_updated_at()` trigger |
| 0002 | `profiles.sql` | User profiles table + auto-create on auth signup |
| 0003 | `is_admin.sql` | `is_admin()` helper + admin RLS on profiles |
| 0004 | `wilayas.sql` | 58 Algerian provinces (code, name_fr/ar) |
| 0005 | `colors.sql` | Shared color palette (name_fr/ar, hex) |
| 0006 | `products.sql` | Products table with RLS, soft-delete, slug, centimes pricing |
| 0007 | `orders.sql` | Orders + order_items, PEAK-YYMMDD-NNNN numbering, guest checkout support |
| 0008 | `views.sql` | `customer_summary` view (total_spent, orders_count per customer) |
| 0009 | `storage.sql` | `product-images` bucket with public-read + admin-write policies |
| 0010 | `seed.sql` | Colors + initial product catalog seed |
| 0011 | `product_images.sql` | Gallery table (`product_images`, ordered by position) |
| 0012 | `products_total_stock.sql` | `total_stock` column on products (denormalized sum) |
| 0013 | `total_stock_trigger.sql` | Trigger keeping `total_stock` in sync when variants change |
| 0014 | `stock_transitions.sql` | Deduct stock on order confirm, restore on cancel |
| 0015 | `home_content.sql` | `home_content` table — editable homepage sections (multi-language) |
| 0016 | `home_products_seed.sql` | 16 seeded homepage products with images, variants, and stock |
| 0017 | `fix_kids_clothing_sizes.sql` | Renames kids apparel variant sizes `6,8,10,12` → `6Y,8Y,10Y,12Y` to match frontend constants |

### Authentication
- Full Supabase Auth: sign up, sign in, sign out, session refresh
- Profile auto-created on signup via DB trigger
- Admin gating: `is_admin()` checked in admin layout + all write operations
- Session state via `useSession()` hook across Client Components

### Product Catalog
- Public product listing with filters (gender, type, category, price range, sort)
- Product detail page: full image gallery, size/color variant selector, related products
- Stock per (product × size × color) with real-time disabled-state for out-of-stock sizes
- Product search in shop page
- Admin: create, edit, soft-delete, duplicate products with multi-image gallery upload
- Admin stock editor: per-variant stock management (size × color grid)
- `total_stock` trigger keeps headline stock number accurate automatically

### Orders & Checkout
- Full cart flow: add to cart → checkout form → server action creates order
- Guest checkout: order lookup by order_number + phone number
- Order snapshots: product_name, price, size, color captured at order time
- Admin order management: list, detail view, status transitions, soft delete
- Stock decrement on order confirm, restore on cancel

### Homepage & Content
- Hero section (editable via admin)
- New Arrivals section (live from Supabase `listFeatured()`)
- 4 Lifestyle sections: Apparel / Performance / Kids / Promotion (editable via `/admin/home`)
- Features section (delivery, returns, payment, quality)
- Homepage content editor with multi-language support (FR/EN/AR)

### i18n (Internationalization)
- 3 locales: French (primary), English, Arabic
- RTL layout support for Arabic
- `useTranslations()` hook available everywhere
- Locale persisted to `localStorage`, switchable from navbar

### Storefront Pages
- `/` — Home
- `/shop` — Product grid with sidebar filters + sort
- `/shop/[id]` — Product detail with gallery, sizes, colors, related products
- `/checkout` — Cart review + shipping form (wilaya → commune → address)
- `/checkout/success` — Order confirmation
- `/login`, `/register`, `/forgot` — Auth pages
- `/about`, `/contact`, `/shipping`, `/returns`, `/faq`, `/promo` — Marketing pages

### Admin Panel (`/admin/*`)
- Dashboard with stats (orders, revenue, products, customers)
- Product management (list, create, edit, stock, duplicate, soft-delete)
- Order management (list, detail, status transitions, bulk actions)
- Customer list (currently mocked — see below)
- Homepage editor (hero + 4 lifestyle sections)
- Settings page

---

## Session Work (2026-05-22)

Changes made in this session:

### Landing Page UX Fixes
- **NewArrivals**: Shows only 4 products (`slice(0, 4)`), added "View More" button → `/shop?sort=newest`
- **NewArrivals**: Each product card now navigates to `/shop/${id}` on click (image + info area)
- **NewArrivals**: Favorite button uses `stopPropagation` so it doesn't trigger navigation
- **LifestyleSection product rows**: Each card wrapped in `<Link href="/shop/${id}">` — full click-to-detail
- **All cards**: `cursor-pointer` added
- **Shop page**: Now reads `?sort=newest` (and all sort values) from URL params on initial load
- **Translations**: Added `common.viewMore` key in all 3 locales (FR/EN/AR)

### Image Fix for Lifestyle Sections
- **Root cause**: `mapCompactRow()` in `lib/repository/supabase/products.ts` was not mapping `image_path` → the `image` field was always `undefined`
- **Fix**: Added `image: buildImageUrl(row.image_path)` to `mapCompactRow()`
- **mockdata.ts**: Also added image URLs to the mock `lifestyleSections` as a fallback
- **LifestyleSection.tsx**: Replaced static SVG placeholder with `next/image` that renders when `product.image` is present

### Kids Sizes Bug Fix
- **Root cause**: Migration 0016 seeded kids apparel variants with sizes `'6', '8', '10', '12'` but `KIDS_CLOTHING_SIZES` constant uses `'6Y', '8Y', ...`. `stockBySize.get("6Y")` always returned `undefined` (= 0 stock) → all size buttons appeared disabled
- **Fix**: Migration 0017 renames the affected rows: `UPDATE product_variants SET size = size || 'Y' WHERE gender='kids' AND type='apparel' AND size IN ('4','6','8','10','12','14')`
- **Apply**: `npx supabase db push`

---

## What's Next (Priority Order)

### P1 — High Impact, Low Effort ✅ DONE

#### 1. ✅ Live Customers in Admin
- Created `lib/repository/supabase/customers.ts` — queries `customer_summary` view via browser client (carries admin session)
- Switched `customersRepo` export in `lib/repository/customers.ts` to use Supabase impl
- Removed "Mock data" badge from admin customers page
- Added loading skeleton, error state, proper empty state
- Customer count shown in toolbar

#### 2. ✅ Real Admin Dashboard Numbers
- Removed fake `mockBaselineRevenue` (1,240,000 DZD) and `+184 orders` baseline
- Dashboard now shows real revenue, order count, product count, customer count
- Removed fake change percentages (no historical data to compare against yet)
- Cleaned up `featured` duplicate count — products list alone is the source of truth

### P2 — Important Features

#### 3. Admin Bulk Actions (Products & Orders)
The bulk delete button for products shows a toast "coming with backend" — it's wired but no-op.

**What to do:**
- Wire bulk soft-delete to `productsRepo.softDelete()` in a loop (or a single RPC)
- Wire bulk order status update to `ordersRepo.updateStatus()`

#### 4. Contact Form Backend
The `/contact` page submits with local state only — nothing is persisted or emailed.

**Options:**
- Add `contact_messages` table + server action (simple, searchable from admin)
- Route to Resend / SendGrid (email delivery, no DB)
- Both: save to DB + send confirmation email

#### 5. User Account Page
Logged-in customers have no "My Orders" page. They can look up orders by order number + phone (guest flow), but there's no account dashboard.

**What to do:**
- Add `/account/orders` listing orders for the logged-in user
- Add `/account/profile` for editing name/phone
- Link from the Navbar user menu (currently only shows logout)

### P3 — Product Quality

#### 6. Production Hardening
- **Email confirmation**: Disabled in dev — enable in production Supabase dashboard
- **Rate limiting**: Guest order creation has no rate limit — add Supabase Edge Function or Upstash Redis limiter
- **Turnstile / CAPTCHA**: Protect guest checkout from bot order spam
- **SMTP**: Configure Supabase SMTP (Resend recommended) for order confirmation emails
- **Service role key rotation**: Never expose in client — double-check `.env.local` is gitignored
- **Error boundaries**: Some Supabase read failures show blank sections — add `<Suspense>` + fallback UI

#### 7. Order Confirmation Email
When an order is placed, send a confirmation email to the customer (or guest phone number via SMS/WhatsApp).

**What to do:**
- Add Resend (or Nodemailer) to the `createOrder` server action
- Template: order number, items list, total, shipping address, tracking link

#### 8. Search
The Navbar has a search icon but no search functionality is implemented.

**What to do:**
- Add `/search?q=...` page
- Query Supabase with `.ilike('name', '%query%')` (already used in admin products)
- Or add `pg_trgm` extension + GIN index for better full-text search

### P4 — Nice to Have

#### 9. Wishlist Sync to DB
Favorites are stored in `localStorage` only — lost when switching devices.

**What to do:**
- Add `wishlists` table (user_id, product_id, created_at)
- Merge localStorage favorites on login
- Sync adds/removes via server action

#### 10. Product Reviews & Ratings
No review system exists. Would add social proof.

**What to do:**
- Add `reviews` table (product_id, user_id, rating 1-5, body, created_at)
- Display star rating on product cards and detail page
- Add review form on detail page (only for verified buyers)

#### 11. Order Tracking Page
Orders have a status (pending → confirmed → shipped → delivered) but there's no customer-facing tracking page besides the success page.

**What to do:**
- Expand `/checkout/success` or add `/orders/[orderNumber]` with status timeline
- Show status visually (step indicator)

#### 12. Inventory Alerts
No low-stock alerts for the admin.

**What to do:**
- Add a low-stock view in admin (products where `total_stock < threshold`)
- Optional: email alert when a product drops below threshold

#### 13. Promo Codes / Discounts
No coupon or promo code system.

**What to do:**
- Add `promo_codes` table (code, discount_pct, max_uses, expiry)
- Apply at checkout with validation server action
- Show discount line in cart

#### 14. Analytics / Reporting
Admin dashboard has summary numbers but no charts or trends.

**What to do:**
- Add revenue chart (last 30 days) using orders grouped by date
- Top selling products list
- Could use Chart.js, Recharts, or Victory

---

## Known Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Kids clothing sizes show disabled | Fixed in session — needs `db push` | Fixed (pending migration) |
| Lifestyle section images missing | Fixed in session | Fixed |
| Admin pagination resets to page 1 on search clear | `/admin/products` | Minor |
| Contact form submits with no persistence | `/contact` | Medium |
| Cart not synced to DB (lost on different device) | `useCart.ts` | Medium |
| Out-of-stock race condition (add to cart → product sells out → checkout) | Checkout server action | Low |

---

## Architecture Decisions (Reference)

| Decision | Rationale |
|----------|-----------|
| Repository pattern | UI imports stable interfaces; swap mock ↔ Supabase without touching components |
| Soft-delete only | Products referenced by order history must never be hard-deleted |
| Stock on variant (size × color) | SKU grain is the variant, not the product; total_stock is a trigger-maintained sum |
| Order snapshots | Price/name copied at order time — historical orders unaffected by catalog edits |
| Money as integer centimes | Avoids floating-point rounding errors across all monetary math |
| Cart in localStorage | V1 decision — no cross-device sync needed yet, avoids DB calls on every add |
| RLS as real boundary | Client-side filters are UX only; Postgres RLS enforces actual permissions |
| `proxy.ts` (not `middleware.ts`) | Next.js 16 renamed the convention; old tutorials using `middleware.ts` won't work |
