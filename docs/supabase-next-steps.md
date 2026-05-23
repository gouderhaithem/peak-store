# Supabase Next Steps

Audit date: 2026-05-22.

This file lists what is still static or mock-backed, what is already live,
and the recommended order for moving the rest of the project onto real
Supabase data.

## Already Live

| Area | Current source | Notes |
|---|---|---|
| Catalog product reads | `productsRepo` -> `lib/repository/supabase/products.ts` | Storefront shop, product detail, cart lookup, favorites lookup, and admin product reads use Supabase. |
| Product create/update/detail delete/duplicate | `productsRepo` | Product form calls live create/update/soft-delete/duplicate paths. |
| Product gallery | `product_images` through `productsRepo.findById()` | Product detail already prefers `product.images[]` and falls back to the primary image. |
| Product stock variants | `product_variants` | Product detail and admin stock editor use variant rows. |
| Orders | `ordersRepo` -> `lib/repository/supabase/orders.ts` | Checkout create, admin order list/detail, status updates, and deletes are live. |
| Homepage hero/section content | `homeContentRepo` -> `home_content` | Admin can edit text, images, CTA, and visibility. |
| Auth/admin gate | Supabase Auth + `profiles` | Root `proxy.ts` refreshes session cookies. |

Step 4, orders create flow, was re-checked on 2026-05-22. Checkout now
creates orders through the Supabase Server Action, validates products and
variants server-side, snapshots line items, attaches `user_id` when a user is
signed in, and uses a phone-verified server lookup for guest receipts.

## Still Static Or Mocked

| Priority | Surface | Current source | What should change |
|---|---|---|---|
| P1 | Admin customers | `lib/mockCustomers.ts` through `customersRepo` | Implement a Supabase customers repo against `customer_summary`, then remove the mock badge in `app/admin/customers/page.tsx`. |
| P1 | Admin dashboard totals | Hardcoded baseline in `app/admin/page.tsx` | Remove fake baseline revenue/order counts and compute real totals from orders/customers/products. |
| P2 | Admin product bulk actions | Toast-only handlers in `app/admin/products/page.tsx` | Wire single delete, bulk soft-delete, and bulk active/draft updates to repository methods. |
| P2 | Homepage lifestyle product strips | `lifestyleSections` in `lib/mockdata.ts` | Either query real products by section slug/type or add a DB-managed featured-products mapping. |
| P2 | Promo campaign blocks | Local arrays/translations in `app/promo/page.tsx` | If promos must be business-managed, add a `promotions` table and admin editor. Product grid already filters real discounted products. |
| P3 | Contact form | Local `sent` state only | Add a `contact_messages` table plus server action, or route submissions to email/CRM. |
| P3 | Shipping zones and fees | Translation arrays in `app/shipping/page.tsx` | Add `shipping_zones`/rates only if fees need admin control or checkout calculation. |
| P3 | Returns, FAQ, About content | Translation-backed static pages | Keep static unless the client needs CMS editing. |
| P4 | Checkout wilaya list | `lib/wilayas.ts` | Optional: read from Supabase `wilayas` table to avoid maintaining two lists. |
| Keep local | Cart, favorites, locale | `localStorage` hooks | Reasonable for v1. Do not move to Supabase unless account-synced carts/favorites are required. |

## Recommended Order

1. Implement live customers.
   - Create `lib/repository/supabase/customers.ts`.
   - Map `customer_summary` rows into the existing `Customer` shape.
   - Switch `customersRepo` from `mockCustomersRepo` to the Supabase repo.
   - Remove the "mock data" badge from the admin customers page.

2. Remove fake admin dashboard numbers.
   - Use real `ordersRepo.list()`, `productsRepo.list()` or `listAdmin()`,
     and live customers.
   - Remove `mockBaselineRevenue`, `+ 184`, and the fake change labels or
     replace them with real period comparisons later.

3. Finish admin product list actions.
   - Reuse `productsRepo.softDelete(id)` for row delete.
   - Add repository methods for bulk soft-delete and active/draft status, or
     loop conservatively with error reporting if the admin volume is small.
   - Refresh the current page after mutation.

4. Decide homepage lifestyle product strategy.
   - Quick path: query real products by existing product type/category for
     each section.
   - Better editorial path: add a join table like
     `home_section_products(section_slug, product_id, position)`.
   - Keep section text/images in `home_content`; only replace the mock product
     rows.

5. Add real contact submissions if the client needs them.
   - Use a Server Action under `app/actions/`.
   - Validate and rate-limit before inserting into Supabase.
   - Add a small admin inbox only if staff will manage messages inside this
     app.

6. Convert business-editable static pages only when required.
   - Shipping rates are the most likely to need real data.
   - FAQ/returns/about can stay translation-backed if they rarely change.

## Implementation Guardrails

- Keep UI imports pointed at repositories. Do not import mock arrays into new
  screens.
- Move shared domain helpers such as `Product` and `formatPrice()` out of
  `lib/mockdata.ts` later; that cleanup is useful but should not block data
  migration.
- For Server Actions, validate auth/admin role inside the action. Do not rely
  only on hiding UI buttons.
- Keep RLS as the real permission boundary. Client-side filters are only UX.
- Run `npm run lint` after each implementation step and `npm run build` after
  changes to actions, auth, routing, or Supabase clients.
