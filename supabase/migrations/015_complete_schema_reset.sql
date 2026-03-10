-- ============================================
-- ImportFlow PRO - Complete Database Schema Reset
-- This migration drops all tables and recreates them with proper relationships
-- Run this in your Supabase SQL Editor
-- ============================================


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

CREATE INDEX idx_importers_slug ON importers(slug);
CREATE INDEX idx_importers_email ON importers(email);
CREATE INDEX idx_importers_subscription_status ON importers(subscription_status);

-- ============================================
-- 2. USERS TABLE (Importer Staff/Admins)
-- Links to auth.users via id (same UUID) and importers via importer_id
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY,  -- Same as auth.users.id - will be set after signup
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'importer', 'staff')),
    importer_id UUID REFERENCES importers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_importer_id ON users(importer_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 3. STORE_CUSTOMERS TABLE (Storefront Customers)
-- Links to auth.users via auth_id (separate UUID reference)
-- Each customer belongs to a specific importer's storefront
-- ============================================
CREATE TABLE store_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,  -- Links to Supabase Auth
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),  -- For email/password login (hashed)
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(importer_id, email)
);

CREATE INDEX idx_store_customers_importer_id ON store_customers(importer_id);
CREATE INDEX idx_store_customers_email ON store_customers(email);
CREATE INDEX idx_store_customers_auth_id ON store_customers(auth_id);

-- ============================================
-- 4. CUSTOMERS TABLE (Importer-managed customers)
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
-- 5. PRODUCTS TABLE
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
    supplier_tracking_number TEXT,
    is_preorder BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_importer_id ON products(importer_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_available ON products(is_available);

-- ============================================
-- 6. ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    store_customer_id UUID REFERENCES store_customers(id) ON DELETE SET NULL,
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
CREATE INDEX idx_orders_store_customer_id ON orders(store_customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ============================================
-- 7. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    payment_status TEXT DEFAULT 'unpaid',
    paid_amount DECIMAL(12,2) DEFAULT 0,
    payment_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- 8. SHIPMENTS TABLE
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
-- 9. SHIPMENT ITEMS TABLE
-- ============================================
CREATE TABLE shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipment_items_shipment_id ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_product_id ON shipment_items(product_id);

-- ============================================
-- 10. PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    store_customer_id UUID REFERENCES store_customers(id) ON DELETE SET NULL,
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
CREATE INDEX idx_payments_store_customer_id ON payments(store_customer_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- 11. SUBSCRIPTIONS TABLE
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
-- 12. PREORDER TRACKING TABLE
-- ============================================
CREATE TABLE preorder_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    tracking_number TEXT NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_preorder_tracking_importer_id ON preorder_tracking(importer_id);
CREATE INDEX idx_preorder_tracking_tracking_number ON preorder_tracking(tracking_number);

-- ============================================
-- 13. CONVERSATIONS TABLE (Messaging)
-- ============================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    store_customer_id UUID NOT NULL REFERENCES store_customers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT 'Product Sourcing Request',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_importer_id ON conversations(importer_id);
CREATE INDEX idx_conversations_store_customer_id ON conversations(store_customer_id);

-- ============================================
-- 14. MESSAGES TABLE (Messaging)
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'importer')),
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

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

-- Apply updated_at triggers
CREATE TRIGGER update_importers_updated_at BEFORE UPDATE ON importers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_customers_updated_at BEFORE UPDATE ON store_customers
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

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE importers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE preorder_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- IMPORTERS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all importers"
ON importers FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer"
ON importers FOR SELECT
USING (
    id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Super admins can insert importers"
ON importers FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can update own importer"
ON importers FOR UPDATE
USING (
    id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- USERS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all users"
ON users FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
);

CREATE POLICY "Users can view own importer users"
ON users FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can view self"
ON users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Super admins can insert users"
ON users FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can update self"
ON users FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- STORE_CUSTOMERS RLS POLICIES
-- ============================================

CREATE POLICY "Public can register as store customer"
ON store_customers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Store customers can view self"
ON store_customers FOR SELECT
USING (auth_id = auth.uid());

CREATE POLICY "Store customers can update self"
ON store_customers FOR UPDATE
USING (auth_id = auth.uid());

CREATE POLICY "Importers can view their store customers"
ON store_customers FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Importers can insert store customers"
ON store_customers FOR INSERT
WITH CHECK (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Importers can update their store customers"
ON store_customers FOR UPDATE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- CUSTOMERS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all customers"
ON customers FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer customers"
ON customers FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can insert own importer customers"
ON customers FOR INSERT
WITH CHECK (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own importer customers"
ON customers FOR UPDATE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can delete own importer customers"
ON customers FOR DELETE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- PRODUCTS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all products"
ON products FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer products"
ON products FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Public can view available products"
ON products FOR SELECT
USING (is_available = true);

CREATE POLICY "Users can insert own importer products"
ON products FOR INSERT
WITH CHECK (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own importer products"
ON products FOR UPDATE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can delete own importer products"
ON products FOR DELETE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- ORDERS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all orders"
ON orders FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer orders"
ON orders FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Store customers can view own orders"
ON orders FOR SELECT
USING (
    store_customer_id IN (SELECT id FROM store_customers WHERE auth_id = auth.uid())
);

CREATE POLICY "Users can insert own importer orders"
ON orders FOR INSERT
WITH CHECK (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own importer orders"
ON orders FOR UPDATE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- ORDER ITEMS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all order_items"
ON order_items FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer order_items"
ON order_items FOR SELECT
USING (
    order_id IN (
        SELECT id FROM orders 
        WHERE importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Store customers can view own order_items"
ON order_items FOR SELECT
USING (
    order_id IN (
        SELECT id FROM orders 
        WHERE store_customer_id IN (SELECT id FROM store_customers WHERE auth_id = auth.uid())
    )
);

CREATE POLICY "Users can insert own importer order_items"
ON order_items FOR INSERT
WITH CHECK (
    order_id IN (
        SELECT id FROM orders 
        WHERE importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can update own importer order_items"
ON order_items FOR UPDATE
USING (
    order_id IN (
        SELECT id FROM orders 
        WHERE importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
    )
);

-- ============================================
-- SHIPMENTS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all shipments"
ON shipments FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer shipments"
ON shipments FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can insert own importer shipments"
ON shipments FOR INSERT
WITH CHECK (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own importer shipments"
ON shipments FOR UPDATE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can delete own importer shipments"
ON shipments FOR DELETE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- SHIPMENT ITEMS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all shipment_items"
ON shipment_items FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer shipment_items"
ON shipment_items FOR SELECT
USING (
    shipment_id IN (
        SELECT id FROM shipments 
        WHERE importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert own importer shipment_items"
ON shipment_items FOR INSERT
WITH CHECK (
    shipment_id IN (
        SELECT id FROM shipments 
        WHERE importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can update own importer shipment_items"
ON shipment_items FOR UPDATE
USING (
    shipment_id IN (
        SELECT id FROM shipments 
        WHERE importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
    )
);

-- ============================================
-- PAYMENTS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all payments"
ON payments FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer payments"
ON payments FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Store customers can view own payments"
ON payments FOR SELECT
USING (
    store_customer_id IN (SELECT id FROM store_customers WHERE auth_id = auth.uid())
);

CREATE POLICY "Users can insert own importer payments"
ON payments FOR INSERT
WITH CHECK (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own importer payments"
ON payments FOR UPDATE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- SUBSCRIPTIONS RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all subscriptions"
ON subscriptions FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer subscription"
ON subscriptions FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Super admins can insert subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admins can update subscriptions"
ON subscriptions FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

-- ============================================
-- PREORDER TRACKING RLS POLICIES
-- ============================================

CREATE POLICY "Super admins can view all preorder_tracking"
ON preorder_tracking FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Users can view own importer preorder_tracking"
ON preorder_tracking FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can insert own importer preorder_tracking"
ON preorder_tracking FOR INSERT
WITH CHECK (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own importer preorder_tracking"
ON preorder_tracking FOR UPDATE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- CONVERSATIONS RLS POLICIES
-- ============================================

CREATE POLICY "Importers can view conversations"
ON conversations FOR SELECT
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Store customers can view own conversations"
ON conversations FOR SELECT
USING (
    store_customer_id IN (SELECT id FROM store_customers WHERE auth_id = auth.uid())
);

CREATE POLICY "Store customers can create conversations"
ON conversations FOR INSERT
WITH CHECK (
    store_customer_id IN (SELECT id FROM store_customers WHERE auth_id = auth.uid())
);

CREATE POLICY "Importers can create conversations"
ON conversations FOR INSERT
WITH CHECK (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Importers can update conversations"
ON conversations FOR UPDATE
USING (
    importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
);

-- ============================================
-- MESSAGES RLS POLICIES
-- ============================================

CREATE POLICY "Importers can view messages"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Store customers can view own messages"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE store_customer_id IN (SELECT id FROM store_customers WHERE auth_id = auth.uid())
    )
);

CREATE POLICY "Importers can insert messages"
ON messages FOR INSERT
WITH CHECK (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE importer_id IN (SELECT importer_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Store customers can insert messages"
ON messages FOR INSERT
WITH CHECK (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE store_customer_id IN (SELECT id FROM store_customers WHERE auth_id = auth.uid())
    )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION authenticate_store_customer(
    p_importer_id UUID,
    p_email VARCHAR(255),
    p_password VARCHAR(255)
)
RETURNS store_customers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer store_customers%ROWTYPE;
BEGIN
    SELECT * INTO v_customer
    FROM store_customers
    WHERE importer_id = p_importer_id
    AND email = p_email
    AND is_active = true;
    
    IF v_customer.id IS NULL THEN
        RETURN NULL;
    END IF;
    
    IF v_customer.password_hash = p_password THEN
        UPDATE store_customers
        SET last_login_at = NOW()
        WHERE id = v_customer.id;
        RETURN v_customer;
    END IF;
    
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION get_or_create_customer(
    p_importer_id UUID,
    p_name VARCHAR(255),
    p_email VARCHAR(255),
    p_phone VARCHAR(50),
    p_address TEXT,
    p_city VARCHAR(100)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    SELECT id INTO v_customer_id
    FROM customers
    WHERE importer_id = p_importer_id
    AND email = p_email;
    
    IF v_customer_id IS NOT NULL THEN
        UPDATE customers
        SET 
            name = COALESCE(p_name, name),
            phone = COALESCE(p_phone, phone),
            address = COALESCE(p_address, address),
            city = COALESCE(p_city, city),
            updated_at = NOW()
        WHERE id = v_customer_id;
        RETURN v_customer_id;
    END IF;
    
    INSERT INTO customers (importer_id, name, email, phone, address, city)
    VALUES (p_importer_id, p_name, p_email, p_phone, p_address, p_city)
    RETURNING id INTO v_customer_id;
    
    RETURN v_customer_id;
END;
$$;

-- ============================================
-- AUTH TRIGGER: Create user record after signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, importer_id, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
        (NEW.raw_user_meta_data->>'importer_id')::UUID,
        true
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_signup();

-- ============================================
-- NOTE: After running this migration
-- 1. Create a super admin user through registration at /admin/register
-- 2. Manually update their role to 'super_admin' in the users table
-- 3. Create importers through the super admin dashboard
-- 4. Create importer staff through the importer dashboard
-- 5. Customers will register themselves at /store/[slug]/register
-- ============================================

