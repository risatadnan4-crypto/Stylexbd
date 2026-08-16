-- ==============================================================================
-- STYLE X: SAFE ALTER TABLE & STRICT CONSTRAINTS MIGRATION SCRIPT
-- ==============================================================================

BEGIN;

-- Step 1: Backfill NULL values with safe defaults to prevent constraint failures
UPDATE public.products SET
    name = COALESCE(name, title, 'Untitled Product'),
    title = COALESCE(title, name, 'Untitled Product'),
    code = COALESCE(code, sku, 'SX-' || SUBSTRING(id FROM 1 FOR 6)),
    sku = COALESCE(sku, code, 'SX-' || SUBSTRING(id FROM 1 FOR 6)),
    slug = COALESCE(slug, seo_slug, 'product-' || id),
    seo_slug = COALESCE(seo_slug, slug, 'product-' || id),
    category = COALESCE(category, 'Luxury Fashion'),
    brand = COALESCE(brand, 'Style X'),
    description = COALESCE(description, ''),
    why_buy = COALESCE(why_buy, ''),
    dimensions = COALESCE(dimensions, ''),
    features = CASE WHEN features IS NULL OR jsonb_typeof(features) != 'array' THEN '[]'::jsonb ELSE features END,
    sizes = CASE WHEN sizes IS NULL OR jsonb_typeof(sizes) != 'array' THEN '[]'::jsonb ELSE sizes END,
    colors = CASE WHEN colors IS NULL OR jsonb_typeof(colors) != 'array' THEN '[]'::jsonb ELSE colors END,
    images = CASE WHEN images IS NULL OR jsonb_typeof(images) != 'array' THEN '[]'::jsonb ELSE images END,
    price = COALESCE(price, 0),
    regular_price = COALESCE(regular_price, price, 0),
    old_price = COALESCE(old_price, 0),
    offer_price = COALESCE(offer_price, 0),
    discount = COALESCE(discount, 0),
    coupon_discount_percent = COALESCE(coupon_discount_percent, 0),
    stock = COALESCE(stock, 0),
    status = COALESCE(status, 'active'),
    trending = COALESCE(trending, false),
    featured = COALESCE(featured, false),
    is_pinned = COALESCE(is_pinned, false),
    lottery_eligible = COALESCE(lottery_eligible, true),
    free_delivery = COALESCE(free_delivery, false),
    likes = COALESCE(likes, 0),
    image_url = COALESCE(image_url, ''),
    video_url = COALESCE(video_url, ''),
    coupon_code = COALESCE(coupon_code, ''),
    delivery_fee = COALESCE(delivery_fee, 100),
    delivery_charges = COALESCE(delivery_charges, 100),
    delivery_dhaka = COALESCE(delivery_dhaka, 100),
    delivery_outside = COALESCE(delivery_outside, 150),
    delivery_chattogram = COALESCE(delivery_chattogram, 150),
    delivery_rajshahi = COALESCE(delivery_rajshahi, 150),
    delivery_khulna = COALESCE(delivery_khulna, 150),
    delivery_barishal = COALESCE(delivery_barishal, 150),
    delivery_sylhet = COALESCE(delivery_sylhet, 150),
    delivery_rangpur = COALESCE(delivery_rangpur, 150),
    delivery_mymensingh = COALESCE(delivery_mymensingh, 150),
    payment_type = COALESCE(payment_type, 'full'),
    payment_percentage = COALESCE(payment_percentage, 100),
    bkash_number = COALESCE(bkash_number, ''),
    nagad_number = COALESCE(nagad_number, ''),
    timer_active = COALESCE(timer_active, false),
    timer_message = COALESCE(timer_message, ''),
    seo_title = COALESCE(seo_title, ''),
    seo_description = COALESCE(seo_description, ''),
    seo_keywords = COALESCE(seo_keywords, ''),
    meta_keywords = COALESCE(meta_keywords, ''),
    canonical_url = COALESCE(canonical_url, ''),
    og_title = COALESCE(og_title, ''),
    og_description = COALESCE(og_description, ''),
    og_image = COALESCE(og_image, ''),
    robots = COALESCE(robots, 'index, follow'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

-- Step 2: Set Column Defaults
ALTER TABLE public.products
    ALTER COLUMN category SET DEFAULT 'Luxury Fashion',
    ALTER COLUMN brand SET DEFAULT 'Style X',
    ALTER COLUMN description SET DEFAULT '',
    ALTER COLUMN why_buy SET DEFAULT '',
    ALTER COLUMN dimensions SET DEFAULT '',
    ALTER COLUMN features SET DEFAULT '[]'::jsonb,
    ALTER COLUMN sizes SET DEFAULT '[]'::jsonb,
    ALTER COLUMN colors SET DEFAULT '[]'::jsonb,
    ALTER COLUMN images SET DEFAULT '[]'::jsonb,
    ALTER COLUMN price SET DEFAULT 0,
    ALTER COLUMN regular_price SET DEFAULT 0,
    ALTER COLUMN old_price SET DEFAULT 0,
    ALTER COLUMN offer_price SET DEFAULT 0,
    ALTER COLUMN discount SET DEFAULT 0,
    ALTER COLUMN coupon_discount_percent SET DEFAULT 0,
    ALTER COLUMN stock SET DEFAULT 0,
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN trending SET DEFAULT false,
    ALTER COLUMN featured SET DEFAULT false,
    ALTER COLUMN is_pinned SET DEFAULT false,
    ALTER COLUMN lottery_eligible SET DEFAULT true,
    ALTER COLUMN free_delivery SET DEFAULT false,
    ALTER COLUMN likes SET DEFAULT 0,
    ALTER COLUMN image_url SET DEFAULT '',
    ALTER COLUMN video_url SET DEFAULT '',
    ALTER COLUMN coupon_code SET DEFAULT '',
    ALTER COLUMN delivery_fee SET DEFAULT 100,
    ALTER COLUMN delivery_charges SET DEFAULT 100,
    ALTER COLUMN delivery_dhaka SET DEFAULT 100,
    ALTER COLUMN delivery_outside SET DEFAULT 150,
    ALTER COLUMN delivery_chattogram SET DEFAULT 150,
    ALTER COLUMN delivery_rajshahi SET DEFAULT 150,
    ALTER COLUMN delivery_khulna SET DEFAULT 150,
    ALTER COLUMN delivery_barishal SET DEFAULT 150,
    ALTER COLUMN delivery_sylhet SET DEFAULT 150,
    ALTER COLUMN delivery_rangpur SET DEFAULT 150,
    ALTER COLUMN delivery_mymensingh SET DEFAULT 150,
    ALTER COLUMN payment_type SET DEFAULT 'full',
    ALTER COLUMN payment_percentage SET DEFAULT 100,
    ALTER COLUMN bkash_number SET DEFAULT '',
    ALTER COLUMN nagad_number SET DEFAULT '',
    ALTER COLUMN timer_active SET DEFAULT false,
    ALTER COLUMN timer_message SET DEFAULT '',
    ALTER COLUMN seo_title SET DEFAULT '',
    ALTER COLUMN seo_description SET DEFAULT '',
    ALTER COLUMN seo_keywords SET DEFAULT '',
    ALTER COLUMN meta_keywords SET DEFAULT '',
    ALTER COLUMN canonical_url SET DEFAULT '',
    ALTER COLUMN og_title SET DEFAULT '',
    ALTER COLUMN og_description SET DEFAULT '',
    ALTER COLUMN og_image SET DEFAULT '',
    ALTER COLUMN robots SET DEFAULT 'index, follow',
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Step 3: Apply NOT NULL Constraints for critical persistence columns
ALTER TABLE public.products
    ALTER COLUMN category SET NOT NULL,
    ALTER COLUMN brand SET NOT NULL,
    ALTER COLUMN description SET NOT NULL,
    ALTER COLUMN why_buy SET NOT NULL,
    ALTER COLUMN features SET NOT NULL,
    ALTER COLUMN sizes SET NOT NULL,
    ALTER COLUMN colors SET NOT NULL,
    ALTER COLUMN images SET NOT NULL,
    ALTER COLUMN price SET NOT NULL,
    ALTER COLUMN regular_price SET NOT NULL,
    ALTER COLUMN old_price SET NOT NULL,
    ALTER COLUMN offer_price SET NOT NULL,
    ALTER COLUMN discount SET NOT NULL,
    ALTER COLUMN stock SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN is_pinned SET NOT NULL,
    ALTER COLUMN lottery_eligible SET NOT NULL,
    ALTER COLUMN free_delivery SET NOT NULL,
    ALTER COLUMN likes SET NOT NULL,
    ALTER COLUMN image_url SET NOT NULL,
    ALTER COLUMN delivery_fee SET NOT NULL,
    ALTER COLUMN delivery_charges SET NOT NULL,
    ALTER COLUMN delivery_dhaka SET NOT NULL,
    ALTER COLUMN delivery_outside SET NOT NULL,
    ALTER COLUMN delivery_chattogram SET NOT NULL,
    ALTER COLUMN delivery_rajshahi SET NOT NULL,
    ALTER COLUMN delivery_khulna SET NOT NULL,
    ALTER COLUMN delivery_barishal SET NOT NULL,
    ALTER COLUMN delivery_sylhet SET NOT NULL,
    ALTER COLUMN delivery_rangpur SET NOT NULL,
    ALTER COLUMN delivery_mymensingh SET NOT NULL,
    ALTER COLUMN payment_type SET NOT NULL,
    ALTER COLUMN payment_percentage SET NOT NULL,
    ALTER COLUMN timer_active SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

-- Step 4: Add Verification Check Constraints (Range & Sanity Checks)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS chk_product_price_non_negative;
ALTER TABLE public.products ADD CONSTRAINT chk_product_price_non_negative CHECK (price >= 0);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS chk_product_stock_non_negative;
ALTER TABLE public.products ADD CONSTRAINT chk_product_stock_non_negative CHECK (stock >= 0);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS chk_product_discount_range;
ALTER TABLE public.products ADD CONSTRAINT chk_product_discount_range CHECK (discount >= 0 AND discount <= 100);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS chk_product_payment_percentage_range;
ALTER TABLE public.products ADD CONSTRAINT chk_product_payment_percentage_range CHECK (payment_percentage >= 0 AND payment_percentage <= 100);

-- Step 5: Create Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_products_is_pinned ON public.products (is_pinned);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

COMMIT;
