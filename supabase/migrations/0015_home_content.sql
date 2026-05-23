-- 0015_home_content.sql
-- Editable homepage content. Five predefined sections (hero + 4 lifestyle).
-- Admin edits text + image + visibility; rows cannot be added or deleted
-- — the layout assumes exactly this set.
--
-- Text fields are denormalized per locale (fr/en/ar). It's verbose but
-- keeps the form straightforward, the indexes simple, and avoids JSONB
-- query gymnastics for what's really a fixed 5-row table.
--
-- Safe to re-run. Existing rows are not overwritten by the seed.

do $$ begin
  create type public.home_section_kind as enum ('hero', 'lifestyle');
exception when duplicate_object then null;
end $$;

create table if not exists public.home_content (
  slug              text primary key,
  kind              public.home_section_kind not null,
  position          integer not null,
  title_fr          text not null,
  title_en          text not null,
  title_ar          text not null,
  -- Optional red accent line under the title. Hero uses it; lifestyle ignores.
  accent_fr         text,
  accent_en         text,
  accent_ar         text,
  description_fr    text,
  description_en    text,
  description_ar    text,
  cta_label_fr      text,
  cta_label_en      text,
  cta_label_ar      text,
  cta_href          text not null default '/shop',
  -- Bucket-relative path inside `product-images`, or a fully-qualified URL.
  -- Same resolution logic as products (see buildImageUrl in the repo).
  image_path        text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists home_content_set_updated_at on public.home_content;
create trigger home_content_set_updated_at
  before update on public.home_content
  for each row execute function public.update_updated_at();

create index if not exists home_content_position_idx
  on public.home_content (position);

-- RLS: anonymous reads see only active rows; admins see everything.
alter table public.home_content enable row level security;

drop policy if exists home_content_read_active on public.home_content;
create policy home_content_read_active on public.home_content
  for select using (is_active = true or public.is_admin());

drop policy if exists home_content_write_admin on public.home_content;
create policy home_content_write_admin on public.home_content
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed with the current i18n copy so the page renders identically right
-- after the migration applies. `on conflict do nothing` keeps re-runs safe
-- and never clobbers an admin's edits.
insert into public.home_content (
  slug, kind, position,
  title_fr, title_en, title_ar,
  accent_fr, accent_en, accent_ar,
  description_fr, description_en, description_ar,
  cta_label_fr, cta_label_en, cta_label_ar,
  cta_href, is_active
) values
  ('hero', 'hero', 0,
   'Élevez votre jeu', 'Elevate Your Game', 'ارفع مستوى لعبتك',
   'Entrez dans l''excellence', 'Step Into Excellence', 'ادخل عالم التميّز',
   'Découvrez des vêtements de sport premium et les dernières sneakers. Du terrain à la rue, Peak Store vous propose un style athlétique authentique à El Oued.',
   'Discover premium sportswear and the latest sneaker drops. From court to street, Peak Store brings you authentic athletic style in El Oued.',
   'اكتشف أحدث الأحذية والملابس الرياضية الفاخرة. من الملعب إلى الشارع، بيك ستور يقدّم لك الأناقة الرياضية الأصلية في الوادي.',
   'Acheter maintenant', 'Shop Now', 'تسوّق الآن',
   '/shop', true),
  ('apparel', 'lifestyle', 1,
   'Peak Apparel — Confort et style', 'Peak Apparel — Comfort Meets Style', 'ملابس بيك — راحة وأناقة',
   null, null, null,
   'Collection premium de vêtements de sport pour chaque athlète',
   'Premium sportswear collection for every athlete',
   'مجموعة فاخرة من الملابس الرياضية لكل رياضي',
   'Explorer la collection', 'Explore Collection', 'اكتشف المجموعة',
   '/shop', true),
  ('performance', 'lifestyle', 2,
   'Innovation et performance', 'Performance Innovation', 'ابتكار وأداء',
   null, null, null,
   'Conçu pour les athlètes qui exigent l''excellence',
   'Engineered for athletes who demand excellence',
   'صُمّمت للرياضيين الذين يطلبون التميّز',
   'Découvrir', 'Discover More', 'اكتشف المزيد',
   '/shop', true),
  ('kids', 'lifestyle', 3,
   'Collection Peak Kids', 'Peak Kids Collection', 'مجموعة بيك للأطفال',
   null, null, null,
   'Chaussures et vêtements de qualité pour les jeunes champions',
   'Quality footwear and apparel for young champions',
   'أحذية وملابس عالية الجودة للأبطال الصغار',
   'Boutique Enfants', 'Shop Kids', 'متجر الأطفال',
   '/shop', true),
  ('promotion', 'lifestyle', 4,
   'Offres à durée limitée', 'Limited Time Offers', 'عروض لفترة محدودة',
   null, null, null,
   'Jusqu''à 30 % de remise sur une sélection — dans la limite des stocks',
   'Up to 30% off on selected items — while stocks last',
   'خصم يصل إلى 30٪ على منتجات مختارة — لفترة محدودة فقط',
   'Voir les soldes', 'Shop Sale Now', 'تسوّق العروض',
   '/shop', true)
on conflict (slug) do nothing;
