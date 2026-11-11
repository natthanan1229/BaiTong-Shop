-- Supabase Database Schema for BaiTong Shop (ร้านอุปกรณ์เครื่องเขียน)
-- Created for natthanan1229/BaiTong-Shop

-- 1. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sell_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_qty INT NOT NULL DEFAULT 0,
    received_qty INT DEFAULT 0,
    sold_qty INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'สั่งซื้อ',
    image_url TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Registered Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    items JSONB NOT NULL,
    net_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_by_name VARCHAR(255),
    created_by_role VARCHAR(50),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sales Table
CREATE TABLE IF NOT EXISTS public.sales (
    id VARCHAR(50) PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    items JSONB NOT NULL,
    net_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cash_received NUMERIC(10, 2) NOT NULL DEFAULT 0,
    change NUMERIC(10, 2) NOT NULL DEFAULT 0,
    baht_text TEXT NOT NULL,
    created_by_name VARCHAR(255),
    created_by_role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    note TEXT,
    created_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Public access policies for demo
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for purchases" ON public.purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
