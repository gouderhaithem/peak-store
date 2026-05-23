-- 0017_fix_kids_clothing_sizes.sql
-- Migration 0016 seeded kids apparel variants with bare numeric sizes
-- ('6', '8', '10', '12'). The frontend KIDS_CLOTHING_SIZES uses the Y-suffix
-- format ('6Y', '8Y', …), causing a lookup mismatch that made every size
-- button appear disabled even when stock was available.
-- This migration renames the affected variant sizes to match the frontend.

UPDATE public.product_variants pv
SET size = pv.size || 'Y'
FROM public.products p
WHERE pv.product_id = p.id
  AND p.gender = 'kids'
  AND p.type = 'apparel'
  AND pv.size IN ('4', '6', '8', '10', '12', '14');
