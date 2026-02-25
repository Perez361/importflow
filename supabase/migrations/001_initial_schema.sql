-- ImportFlow PRO Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. IMPORTERS TABLE
-- ============================================
CREATE TABLE importers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Ghana',
    currency TEXT DEFAULT 'GHS',
    is_active BOOLEAN DEFAULT true,
    subscription_status TEXT DEFAULT 'trial',
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups (storefront)
CREATE INDEX idx_importers_slug ON importers(slug);
CREATE INDEX idx_importers_email ON importers(email);
CREATE INDEX idx_importers_subscription_status ON importers(subscription_status);

-- ============================================
-- 2. USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'staff',
    importer_id UUID REFERENCES importers(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for importer-scoped queries
CREATE INDEX idx_users_importer_id ON users(importer_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 3. CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_importer_id ON customers(importer_id);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- 4. PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    category TEXT,
    image_url TEXT,
    cost_price DECIMAL(12,2),
    selling_price DECIMAL(12,2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_importer_id ON products(importer_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_available ON products(is_available);

-- ============================================
-- 5. ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    subtotal DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_importer_id ON orders(importer_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ============================================
-- 6. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- 7. SHIPMENTS TABLE
-- ============================================
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    shipment_number TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    status TEXT DEFAULT 'preparing',
    shipping_cost DECIMAL(12,2),
    customs_cost DECIMAL(12,2),
    other_costs DECIMAL(12,2),
    estimated_arrival DATE,
    actual_arrival DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipments_importer_id ON shipments(importer_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_shipment_number ON shipments(shipment_number);

-- ============================================
-- 8. SHIPMENT ITEMS TABLE
-- ============================================
CREATE TABLE shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipment_items_shipment_id ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_product_id ON shipment_items(product_id);

-- ============================================
-- 9. PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT,
    reference TEXT,
    status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_importer_id ON payments(importer_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- 10. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    price DECIMAL(12,2) NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    paystack_subscription_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_importer_id ON subscriptions(importer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_importers_updated_at BEFORE UPDATE ON importers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE importers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- IMPORTERS RLS POLICIES
-- ============================================

-- Super admins can see all importers
CREATE POLICY "Super admins can view all importers"
ON importers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view their own importer
CREATE POLICY "Users can view own importer"
ON importers FOR SELECT
USING (
    id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Super admins can insert importers
CREATE POLICY "Super admins can insert importers"
ON importers FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can update their own importer
CREATE POLICY "Users can update own importer"
ON importers FOR UPDATE
USING (
    id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- USERS RLS POLICIES
-- ============================================

-- Super admins can see all users
CREATE POLICY "Super admins can view all users"
ON users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() 
        AND u.role = 'super_admin'
    )
);

-- Users can see users in their own importer
CREATE POLICY "Users can view own importer users"
ON users FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can view themselves
CREATE POLICY "Users can view self"
ON users FOR SELECT
USING (id = auth.uid());

-- Super admins can insert users
CREATE POLICY "Super admins can insert users"
ON users FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can update themselves
CREATE POLICY "Users can update self"
ON users FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- PRODUCTS RLS POLICIES
-- ============================================

-- Super admins can see all products
CREATE POLICY "Super admins can view all products"
ON products FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view own importer products
CREATE POLICY "Users can view own importer products"
ON products FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Public can view available products (for storefront)
CREATE POLICY "Public can view available products"
ON products FOR SELECT
USING (is_available = true);

-- Users can insert own importer products
CREATE POLICY "Users can insert own importer products"
ON products FOR INSERT
WITH CHECK (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can update own importer products
CREATE POLICY "Users can update own importer products"
ON products FOR UPDATE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can delete own importer products
CREATE POLICY "Users can delete own importer products"
ON products FOR DELETE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- CUSTOMERS RLS POLICIES
-- ============================================

-- Super admins can see all customers
CREATE POLICY "Super admins can view all customers"
ON customers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view own importer customers
CREATE POLICY "Users can view own importer customers"
ON customers FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can insert own importer customers
CREATE POLICY "Users can insert own importer customers"
ON customers FOR INSERT
WITH CHECK (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can update own importer customers
CREATE POLICY "Users can update own importer customers"
ON customers FOR UPDATE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can delete own importer customers
CREATE POLICY "Users can delete own importer customers"
ON customers FOR DELETE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- ORDERS RLS POLICIES
-- ============================================

-- Super admins can see all orders
CREATE POLICY "Super admins can view all orders"
ON orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view own importer orders
CREATE POLICY "Users can view own importer orders"
ON orders FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Public can view orders (for customer tracking - limited)
-- This would need additional logic for customer-specific access

-- Users can insert own importer orders
CREATE POLICY "Users can insert own importer orders"
ON orders FOR INSERT
WITH CHECK (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can update own importer orders
CREATE POLICY "Users can update own importer orders"
ON orders FOR UPDATE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- ORDER ITEMS RLS POLICIES
-- ============================================

-- Super admins can see all order items
CREATE POLICY "Super admins can view all order_items"
ON order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view own importer order items
CREATE POLICY "Users can view own importer order_items"
ON order_items FOR SELECT
USING (
    order_id IN (
        SELECT id FROM orders 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- Users can insert own importer order items
CREATE POLICY "Users can insert own importer order_items"
ON order_items FOR INSERT
WITH CHECK (
    order_id IN (
        SELECT id FROM orders 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- Users can update own importer order items
CREATE POLICY "Users can update own importer order_items"
ON order_items FOR UPDATE
USING (
    order_id IN (
        SELECT id FROM orders 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- ============================================
-- SHIPMENTS RLS POLICIES
-- ============================================

-- Super admins can see all shipments
CREATE POLICY "Super admins can view all shipments"
ON shipments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view own importer shipments
CREATE POLICY "Users can view own importer shipments"
ON shipments FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can insert own importer shipments
CREATE POLICY "Users can insert own importer shipments"
ON shipments FOR INSERT
WITH CHECK (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can update own importer shipments
CREATE POLICY "Users can update own importer shipments"
ON shipments FOR UPDATE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can delete own importer shipments
CREATE POLICY "Users can delete own importer shipments"
ON shipments FOR DELETE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- SHIPMENT ITEMS RLS POLICIES
-- ============================================

-- Super admins can see all shipment items
CREATE POLICY "Super admins can view all shipment_items"
ON shipment_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view own importer shipment items
CREATE POLICY "Users can view own importer shipment_items"
ON shipment_items FOR SELECT
USING (
    shipment_id IN (
        SELECT id FROM shipments 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- Users can insert own importer shipment items
CREATE POLICY "Users can insert own importer shipment_items"
ON shipment_items FOR INSERT
WITH CHECK (
    shipment_id IN (
        SELECT id FROM shipments 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- Users can update own importer shipment items
CREATE POLICY "Users can update own importer shipment_items"
ON shipment_items FOR UPDATE
USING (
    shipment_id IN (
        SELECT id FROM shipments 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- ============================================
-- PAYMENTS RLS POLICIES
-- ============================================

-- Super admins can see all payments
CREATE POLICY "Super admins can view all payments"
ON payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view own importer payments
CREATE POLICY "Users can view own importer payments"
ON payments FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can insert own importer payments
CREATE POLICY "Users can insert own importer payments"
ON payments FOR INSERT
WITH CHECK (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Users can update own importer payments
CREATE POLICY "Users can update own importer payments"
ON payments FOR UPDATE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- SUBSCRIPTIONS RLS POLICIES
-- ============================================

-- Super admins can see all subscriptions
CREATE POLICY "Super admins can view all subscriptions"
ON subscriptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Users can view own importer subscription
CREATE POLICY "Users can view own importer subscription"
ON subscriptions FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Super admins can insert subscriptions
CREATE POLICY "Super admins can insert subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Super admins can update subscriptions
CREATE POLICY "Super admins can update subscriptions"
ON subscriptions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Create storage bucket for importer logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('importer-logos', 'importer-logos', true);

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
);

-- Storage policies for importer logos
CREATE POLICY "Anyone can view importer logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'importer-logos');

CREATE POLICY "Authenticated users can upload importer logos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'importer-logos' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own importer logos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'importer-logos' 
    AND auth.role() = 'authenticated'
);

-- ============================================
-- INITIAL SUPER ADMIN USER
-- ============================================
-- After running this schema, you'll need to:
-- 1. Create a user through Supabase Auth
-- 2. Update the users table to set role = 'super_admin' for that user

-- Example (replace with actual user ID after registration):
-- INSERT INTO users (id, email, full_name, role)
-- VALUES ('user-uuid-from-auth', 'admin@importflow.app', 'Admin', 'super_admin');
