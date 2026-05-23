# Peak Store — Database setup

This folder contains the SQL files that build the Peak Store database
from scratch. Run them once when setting up a new Supabase project.

---

## How to apply the migrations

1. Open the Supabase dashboard at <https://supabase.com/dashboard> and pick
   your project.
2. In the left sidebar, click **SQL Editor**.
3. Open `0001_enums.sql` from this folder in your code editor.
4. Copy the **entire** contents and paste it into the SQL Editor.
5. Click **Run** (or press Ctrl/Cmd + Enter).
6. Wait for a green "Success. No rows returned" message.
7. Repeat with `0002_profiles.sql`, then `0003_is_admin.sql`, …, all the
   way through the latest numbered migration.

**Order matters.** Don't skip a file. Don't run a later file before its
predecessors.

Every file is safe to re-run — they use `if not exists` / `or replace` /
`on conflict do nothing` so re-running one is a no-op.

---

## After all 10 files: promote yourself to admin

The database starts with zero users. There is no built-in admin login.
To make the first admin:

1. Open the Peak Store website and click **Register**.
2. Sign up using your real email and a password.
3. If Supabase sends a confirmation email, click the link.
4. Go back to the Supabase **SQL Editor** and run **this single query**,
   replacing the email with the one you just used:

   ```sql
   update public.profiles
      set role = 'admin'
    where id = (select id from auth.users where email = 'your-email@example.com');
   ```

5. Log out of the website and log back in. You will now have access to
   the admin pages.

To make more admins later, repeat step 4 with their email.

---

## File reference

| File                  | What it does                                                                              |
|-----------------------|-------------------------------------------------------------------------------------------|
| `0001_enums.sql`      | Custom column types (user roles, product categories, order statuses) + shared `update_updated_at` helper. |
| `0002_profiles.sql`   | The `profiles` table that extends every auth user with full_name / phone / role. Auto-creates a row on signup. |
| `0003_is_admin.sql`   | The `is_admin()` helper used by every "admin only" rule, plus the admin-side access rules for profiles. |
| `0004_wilayas.sql`    | Empty `wilayas` table for the 58 Algerian provinces (filled in 0010).                     |
| `0005_colors.sql`     | Empty `colors` table for the shared color palette (filled in 0010).                       |
| `0006_products.sql`   | `products` + `product_variants`. Stock lives on the variant. Soft-delete only.            |
| `0007_orders.sql`     | `orders` + `order_items`. Auto order numbers, auto-computed totals, stock decrement on admin confirm. |
| `0008_views.sql`      | `customer_summary` — derived per-customer totals, always in sync with orders.             |
| `0009_storage.sql`    | The `product-images` storage bucket (public read, admin write).                           |
| `0010_seed.sql`       | The 58 wilayas + 6 base colors. No products.                                              |
| `0016_home_products_seed.sql` | Starter products + variants for homepage product sections.                       |

---

## Troubleshooting

**"function public.is_admin() does not exist"** while running `0004` or
later — you skipped `0003_is_admin.sql`. Run it, then re-run the failing
file.

**"type public.user_role already exists"** — you already ran `0001`. Safe
to ignore; the file uses guards but older Postgres versions surface the
error anyway. Move on to the next file.

**Signup creates the auth user but no row in `profiles`** — the
`handle_new_auth_user` trigger in `0002` did not install. Re-run `0002`
and try signing up again.

---

## Where the design lives

The full schema design, decisions, and trade-offs are documented in
[`/docs/supabase-schema.md`](../../docs/supabase-schema.md). Read that
first if you need to change the schema.
