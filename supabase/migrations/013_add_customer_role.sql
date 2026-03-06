-- Add 'customer' role to users table
-- This role is for store customers who should only access their storefront profile

-- First, let's add a CHECK constraint to allow 'customer' role
-- Since role is just TEXT, we don't need to alter the type, just ensure it's valid

-- Update any existing store customers in users table to have 'customer' role
-- This will fix existing accounts that were incorrectly assigned 'importer' role
UPDATE users 
SET role = 'customer' 
WHERE id IN (
  SELECT DISTINCT sc.auth_id 
  FROM store_customers sc 
  WHERE sc.auth_id IS NOT NULL
) 
AND role = 'importer';

-- Note: The role column is TEXT type, so 'customer' is already a valid value
-- No schema changes needed - just ensuring data consistency
