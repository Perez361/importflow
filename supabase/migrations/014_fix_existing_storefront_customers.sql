-- Fix existing storefront customers who were incorrectly assigned 'importer' role
-- This migration corrects the role for users who registered through storefront but got 'importer' role

-- First, let's identify and fix users who:
-- 1. Have importer role
-- 2. Have a store_customer record (meaning they registered through storefront)
-- 3. Do NOT have an importer record (the importer creation failed or was skipped)

-- Update users who have store_customer records but have importer role
-- These are storefront customers who should have 'customer' role
UPDATE users 
SET role = 'customer'
WHERE id IN (
  SELECT DISTINCT sc.auth_id 
  FROM store_customers sc 
  WHERE sc.auth_id IS NOT NULL
) 
AND role = 'importer';

-- Also update any users who have is_storefront_customer = true in their metadata
-- but were given importer role
UPDATE users
SET role = 'customer'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'is_storefront_customer' = 'true'
)
AND role = 'importer';

-- Log the changes for verification
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % users with incorrect importer role', fixed_count;
END $$;

