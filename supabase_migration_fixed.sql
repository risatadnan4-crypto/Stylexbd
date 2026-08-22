-- ==============================================================================
-- STYLE X — COMPLETE IDEMPOTENT SUPABASE MIGRATION & RLS REPAIR SCRIPT
-- Resolves ERROR 42710 (policy already exists) + Enforces Types & Constraints
-- ==============================================================================

BEGIN;

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. PRODUCTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT,
    title TEXT,
    code TEXT,
    sku TEXT,
    slug TEXT,
    seo_slug TEXT,
    category TEXT DEFAULT 'Luxury Fashion',
    brand TEXT DEFAULT 'Style X',
    description TEXT DEFAULT '',
    why_buy TEXT DEFAULT '',
    features JSONB DEFAULT '[]'::jsonb,
    dimensions TEXT DEFAULT '',
    sizes JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    price NUMERIC DEFAULT 0,
    regular_price NUMERIC DEFAULT 0,
    old_price NUMERIC DEFAULT 0,
    offer_price NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    coupon_discount_percent NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    trending BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    lottery_eligible BOOLEAN DEFAULT true,
    free_delivery BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    image_url TEXT DEFAULT '',
    images JSONB DEFAULT '[]'::jsonb,
    video_url TEXT DEFAULT '',
    coupon_code TEXT DEFAULT '',
    delivery_fee NUMERIC DEFAULT 100,
    delivery_charge NUMERIC DEFAULT 100,
    delivery_charges NUMERIC DEFAULT 100,
    delivery_dhaka NUMERIC DEFAULT 100,
    delivery_outside NUMERIC DEFAULT 150,
    delivery_chattogram NUMERIC DEFAULT 150,
    delivery_rajshahi NUMERIC DEFAULT 150,
    delivery_khulna NUMERIC DEFAULT 150,
    delivery_barishal NUMERIC DEFAULT 150,
    delivery_sylhet NUMERIC DEFAULT 150,
    delivery_rangpur NUMERIC DEFAULT 150,
    delivery_mymensingh NUMERIC DEFAULT 150,
    payment_type TEXT DEFAULT 'full',
    payment_percentage NUMERIC DEFAULT 100,
    bkash_number TEXT DEFAULT '',
    nagad_number TEXT DEFAULT '',
    timer_start_time TIMESTAMPTZ,
    timer_end_time TIMESTAMPTZ,
    timer_end_at TIMESTAMPTZ,
    timer_message TEXT DEFAULT '',
    timer_active BOOLEAN DEFAULT false,
    timer_enabled BOOLEAN DEFAULT false,
    seo_title TEXT DEFAULT '',
    seo_description TEXT DEFAULT '',
    seo_keywords TEXT DEFAULT '',
    meta_keywords TEXT DEFAULT '',
    canonical_url TEXT DEFAULT '',
    og_title TEXT DEFAULT '',
    og_description TEXT DEFAULT '',
    og_image TEXT DEFAULT '',
    robots TEXT DEFAULT 'index, follow',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. CARTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.carts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT UNIQUE,
    user_id TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    customer_city TEXT,
    division TEXT,
    district TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC DEFAULT 0,
    subtotal NUMERIC DEFAULT 0,
    delivery_charge NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    coupon_code TEXT,
    payment_method TEXT DEFAULT 'cash_on_delivery',
    payment_status TEXT DEFAULT 'pending',
    order_status TEXT DEFAULT 'pending',
    tracking_code TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'app_settings',
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. REVIEWS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT,
    customer_name TEXT,
    rating INTEGER DEFAULT 5,
    comment TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. COUPONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT DEFAULT 'percent',
    discount_value NUMERIC DEFAULT 0,
    min_order_amount NUMERIC DEFAULT 0,
    expiry_date TIMESTAMPTZ,
    usage_limit INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true), ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ==============================================================================
-- 9. SAFE IDEMPOTENT RLS POLICIES (Resolves Error 42710)
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- CARTS Policies (Safe Drop Before Create)
DROP POLICY IF EXISTS "select_all_carts" ON public.carts;
DROP POLICY IF EXISTS "insert_carts" ON public.carts;
DROP POLICY IF EXISTS "update_carts" ON public.carts;
DROP POLICY IF EXISTS "delete_carts" ON public.carts;
DROP POLICY IF EXISTS "Allow Cart Operations" ON public.carts;

CREATE POLICY "Allow Cart Operations" ON public.carts
    FOR ALL USING (true) WITH CHECK (true);

-- PRODUCTS Policies
DROP POLICY IF EXISTS "Allow Public Product Read" ON public.products;
DROP POLICY IF EXISTS "Allow Public Product Write" ON public.products;
DROP POLICY IF EXISTS "select_all_products" ON public.products;

CREATE POLICY "Allow Public Product Read" ON public.products
    FOR SELECT USING (true);
CREATE POLICY "Allow Public Product Write" ON public.products
    FOR ALL USING (true) WITH CHECK (true);

-- SETTINGS Policies
DROP POLICY IF EXISTS "Allow Public Settings Read" ON public.settings;
DROP POLICY IF EXISTS "Allow Public Settings Write" ON public.settings;

CREATE POLICY "Allow Public Settings Read" ON public.settings
    FOR SELECT USING (true);
CREATE POLICY "Allow Public Settings Write" ON public.settings
    FOR ALL USING (true) WITH CHECK (true);

-- ORDERS Policies
DROP POLICY IF EXISTS "Allow Order Operations" ON public.orders;
CREATE POLICY "Allow Order Operations" ON public.orders
    FOR ALL USING (true) WITH CHECK (true);

-- REVIEWS Policies
DROP POLICY IF EXISTS "Allow Review Operations" ON public.reviews;
CREATE POLICY "Allow Review Operations" ON public.reviews
    FOR ALL USING (true) WITH CHECK (true);

-- COUPONS Policies
DROP POLICY IF EXISTS "Allow Coupon Operations" ON public.coupons;
CREATE POLICY "Allow Coupon Operations" ON public.coupons
    FOR ALL USING (true) WITH CHECK (true);

-- STORAGE Policies
DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Updates" ON storage.objects;

CREATE POLICY "Public Media Read" ON storage.objects
    FOR SELECT USING (bucket_id IN ('media', 'products'));
CREATE POLICY "Allow All Uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id IN ('media', 'products'));
CREATE POLICY "Allow All Updates" ON storage.objects
    FOR UPDATE USING (bucket_id IN ('media', 'products'));

COMMIT;
