-- Migration: Add avatar_url to store_customers table

-- Add avatar_url column to store_customers
ALTER TABLE store_customers 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for avatar lookups
CREATE INDEX IF NOT EXISTS idx_store_customers_avatar 
ON store_customers(avatar_url) 
WHERE avatar_url IS NOT NULL;
