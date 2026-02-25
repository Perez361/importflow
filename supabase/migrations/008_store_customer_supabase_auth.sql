-- Migration: Add Supabase Auth support for store customers
-- This enables secure authentication via Supabase Auth

-- Add auth_id column to link to Supabase Auth users
ALTER TABLE store_customers 
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for auth lookups
CREATE INDEX IF NOT EXISTS idx_store_customers_auth_id ON store_customers(auth_id);

-- Update RLS policies to allow public read for active store (for login lookup)
-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS "Public can register as store customer" ON store_customers;

-- Allow public insert (registration) - but we'll handle this via Supabase Auth
CREATE POLICY "Anyone can insert store customer" 
ON store_customers FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read their own profile
CREATE POLICY "Store customers can read own profile"
ON store_customers FOR SELECT
USING (auth.uid() = auth_id);

-- Allow customers to update their own profile
CREATE POLICY "Store customers can update own profile"
ON store_customers FOR UPDATE
USING (auth.uid() = auth_id);

-- Allow importers to manage their customers (existing policy covers this)
-- But we need to ensure the auth_id column is viewable
COMMENT ON COLUMN store_customers.auth_id IS 'Link to Supabase Auth user ID';

-- Create a function to link/create store customer after Supabase Auth registration
CREATE OR REPLACE FUNCTION handle_store_customer_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if customer already exists for this importer and email
    IF NEW.raw_user_meta_data->>'importer_id' IS NOT NULL THEN
        INSERT INTO store_customers (
            importer_id,
            auth_id,
            email,
            name,
            phone,
            address,
            city
        ) VALUES (
            (NEW.raw_user_meta_data->>'importer_id')::UUID,
            NEW.id,
            NEW.email,
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'address',
            NEW.raw_user_meta_data->>'city'
        )
        ON CONFLICT (importer_id, email) DO UPDATE
        SET auth_id = NEW.id,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger should be created in Supabase Dashboard > Authentication > Hooks
-- Or you can enable it here if you have the proper extensions

-- Create helper function to get customer by auth user
CREATE OR REPLACE FUNCTION get_store_customer_by_auth(p_auth_id UUID)
RETURNS store_customers AS $$
    SELECT * FROM store_customers 
    WHERE auth_id = p_auth_id 
    AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER;
