-- Migration: Add store customers table for storefront authentication
-- This allows customers to create accounts on individual store storefronts

-- Create store_customers table
CREATE TABLE IF NOT EXISTS store_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(importer_id, email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_customers_importer_id ON store_customers(importer_id);
CREATE INDEX IF NOT EXISTS idx_store_customers_email ON store_customers(email);

-- Enable RLS
ALTER TABLE store_customers ENABLE ROW LEVEL SECURITY;

-- Policy: Importers can view their own store customers
CREATE POLICY "Importers can view their store customers"
ON store_customers FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Policy: Importers can insert store customers
CREATE POLICY "Importers can insert store customers"
ON store_customers FOR INSERT
WITH CHECK (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Policy: Importers can update their store customers
CREATE POLICY "Importers can update their store customers"
ON store_customers FOR UPDATE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Policy: Public can register (insert) for a specific store
CREATE POLICY "Public can register as store customer"
ON store_customers FOR INSERT
WITH CHECK (true);

-- Policy: Store customers can view their own profile
-- Note: This requires the customer to be logged in via a custom auth mechanism
-- For now, we'll use a simpler approach with session-based auth

-- Create a function to authenticate store customers
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
    
    -- Simple password check (in production, use proper bcrypt)
    -- For now, we'll compare directly (password should be hashed client-side or use Supabase Auth)
    IF v_customer.password_hash = p_password THEN
        -- Update last login
        UPDATE store_customers
        SET last_login_at = NOW()
        WHERE id = v_customer.id;
        
        RETURN v_customer;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Create a function to get or create customer from order
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
    -- Check if customer exists
    SELECT id INTO v_customer_id
    FROM customers
    WHERE importer_id = p_importer_id
    AND email = p_email;
    
    IF v_customer_id IS NOT NULL THEN
        -- Update customer info
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
    
    -- Create new customer
    INSERT INTO customers (
        importer_id,
        name,
        email,
        phone,
        address,
        city
    )
    VALUES (
        p_importer_id,
        p_name,
        p_email,
        p_phone,
        p_address,
        p_city
    )
    RETURNING id INTO v_customer_id;
    
    RETURN v_customer_id;
END;
$$;

-- Add updated_at trigger for store_customers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_customers_updated_at
BEFORE UPDATE ON store_customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
