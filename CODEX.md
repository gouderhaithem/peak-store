# Codex Handoff

This project is a Next.js 16.2.6 App Router storefront/admin app backed
partly by Supabase. Before changing application code, read the relevant
local Next.js guide in `node_modules/next/dist/docs/`; `AGENTS.md` is
intentional because this version changed conventions.

## Local Next.js Notes

- Routes live under `app/` and pages/layouts are Server Components by
  default.
- Use Client Components only for browser state, event handlers, effects,
  `localStorage`, and interactive controls.
- Fetch database data in Server Components where practical. Existing UI
  still has many Client Components, so keep the repository boundary stable
  when migrating incrementally.
- Mutations that need secrets or server-side validation should use Server
  Functions/Actions under `app/actions/`. Always verify authorization inside
  the action because actions are reachable by direct POST.
- Next.js 16 uses root `proxy.ts`, not `middleware.ts`. This project already
  uses it for Supabase session refresh.

## Data Architecture

Prefer the repository layer over direct imports from mock files.

- `productsRepo`: live Supabase implementation in
  `lib/repository/supabase/products.ts`.
- `ordersRepo`: live Supabase implementation in
  `lib/repository/supabase/orders.ts`.
- `homeContentRepo`: live Supabase implementation in
  `lib/repository/supabase/homeContent.ts`.
- `customersRepo`: still mock-only in `lib/repository/customers.ts`.

The historical `Product` type and `formatPrice()` still live in
`lib/mockdata.ts`, so many files import that module for typing/formatting
even when the actual data is already coming from Supabase.

## Static Or Mock Surfaces

- Admin customers use `MOCK_CUSTOMERS` through `customersRepo`.
- Homepage lifestyle product strips use `lifestyleSections` from
  `lib/mockdata.ts`; the section text/images are live in `home_content`.
- Admin dashboard adds fake baseline revenue/order counts.
- Admin product list bulk delete and bulk status actions show
  "coming with backend" toasts.
- Contact form only shows a local success state; it does not persist.
- Shipping, returns, FAQ, about, and promo marketing blocks are static
  translation-backed content.
- Checkout wilayas come from `lib/wilayas.ts` even though Supabase also has
  a `wilayas` table.
- Cart, favorites, and locale preference use `localStorage` intentionally
  for v1.

## Recommended Start

Start with `customersRepo` because the database already has
`customer_summary`, the UI surface is small, and it removes the clearest
remaining admin mock badge. After that, finish admin product bulk actions,
then decide whether homepage lifestyle product strips should be dynamic
catalog queries or stay editorial/static.

See `docs/supabase-next-steps.md` for the full migration order.

## Verification

Run `npm run lint` after code changes. Run `npm run build` when touching
Next.js routing, Server Actions, Supabase clients, auth, or migrations.
