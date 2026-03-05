-- Migration: Fix store_customer OAuth support
-- This fixes the customer_creation_failed error during Google OAuth login

-- 1. Make password_hash nullable for OAuth users (they don't have passwords)
ALTER TABLE store_customers 
ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Add unique constraint on (importer_id, auth_id) for proper OAuth upsert
-- First, drop any existing index if it exists
DROP INDEX IF EXISTS idx_store_customers_auth_id;

-- Add the auth_id column if not exists (from migration 008, but ensure it's here)
ALTER TABLE store_customers 
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create unique constraint on (importer_id, auth_id)
-- This allows upserting by auth_id when user logs in with OAuth
ALTER TABLE store_customers 
ADD CONSTRAINT store_customers_importer_auth_unique UNIQUE (importer_id, auth_id);

-- 3. Create index for auth lookups
CREATE INDEX IF NOT EXISTS idx_store_customers_auth_id ON store_customers(auth_id);

-- 4. Update RLS policies to ensure public can insert for OAuth
-- Drop and recreate the public insert policy
DROP POLICY IF EXISTS "Anyone can insert store customer" ON store_customers;

CREATE POLICY "Anyone can insert store customer" 
ON store_customers FOR INSERT WITH CHECK (true);

-- Also ensure the policy for selecting own profile works with auth_id
DROP POLICY IF EXISTS "Store customers can read own profile" ON store_customers;

CREATE POLICY "Store customers can read own profile"
ON store_customers FOR SELECT
USING (
    auth.uid() = auth_id 
    OR auth.uid() = (
        SELECT id FROM auth.users WHERE email = store_customers.email
    )
);

-- Drop and recreate the update policy
DROP POLICY IF EXISTS "Store customers can update own profile" ON store_customers;

CREATE POLICY "Store customers can update own profile"
ON store_customers FOR UPDATE
USING (auth.uid() = auth_id);

COMMENT ON COLUMN store_customers.auth_id IS 'Link to Supabase Auth user ID - used for OAuth login';

