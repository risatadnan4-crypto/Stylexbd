-- ==============================================================================
-- STYLE X — COMPLETE SUPABASE PERSISTENCE & SCHEMA MIGRATION SCRIPT
-- Run this script in the Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT,
    title TEXT,
    code TEXT,
    sku TEXT,
    slug TEXT,
    seo_slug TEXT,
    category TEXT DEFAULT 'Uncategorized',
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

-- 3. ORDERS TABLE
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

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'app_settings',
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REVIEWS TABLE
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

-- 6. COUPONS TABLE
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

-- 7. STORAGE BUCKETS (Create media & products buckets if not present)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true), ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. STORAGE POLICIES (Allow public read and authenticated write)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
    CREATE POLICY "Public Media Read" ON storage.objects
        FOR SELECT USING (bucket_id IN ('media', 'products'));

    DROP POLICY IF EXISTS "Allow All Uploads" ON storage.objects;
    CREATE POLICY "Allow All Uploads" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id IN ('media', 'products'));
        
    DROP POLICY IF EXISTS "Allow All Updates" ON storage.objects;
    CREATE POLICY "Allow All Updates" ON storage.objects
        FOR UPDATE USING (bucket_id IN ('media', 'products'));
END $$;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Products: Read for everyone, Write for service role & authenticated
    DROP POLICY IF EXISTS "Allow Public Product Read" ON public.products;
    CREATE POLICY "Allow Public Product Read" ON public.products FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow Public Product Write" ON public.products;
    CREATE POLICY "Allow Public Product Write" ON public.products FOR ALL USING (true) WITH CHECK (true);

    -- Settings: Read for everyone, Write for all
    DROP POLICY IF EXISTS "Allow Public Settings Read" ON public.settings;
    CREATE POLICY "Allow Public Settings Read" ON public.settings FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Allow Public Settings Write" ON public.settings;
    CREATE POLICY "Allow Public Settings Write" ON public.settings FOR ALL USING (true) WITH CHECK (true);

    -- Orders: Read & Write
    DROP POLICY IF EXISTS "Allow Order Operations" ON public.orders;
    CREATE POLICY "Allow Order Operations" ON public.orders FOR ALL USING (true) WITH CHECK (true);

    -- Reviews: Read & Write
    DROP POLICY IF EXISTS "Allow Review Operations" ON public.reviews;
    CREATE POLICY "Allow Review Operations" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

    -- Coupons: Read & Write
    DROP POLICY IF EXISTS "Allow Coupon Operations" ON public.coupons;
    CREATE POLICY "Allow Coupon Operations" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
END $$;
