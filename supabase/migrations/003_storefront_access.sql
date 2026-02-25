-- Migration: Add public access for storefront
-- This allows unauthenticated users to view active importers (stores)

-- Allow public to view active importers (for storefront)
DROP POLICY IF EXISTS "Public can view active importers" ON importers;
CREATE POLICY "Public can view active importers"
ON importers FOR SELECT
USING (is_active = true);

-- Allow public to view available products from active importers
DROP POLICY IF EXISTS "Public can view available products" ON products;
CREATE POLICY "Public can view available products"
ON products FOR SELECT
USING (
    is_available = true 
    AND quantity > 0
    AND importer_id IN (
        SELECT id FROM importers WHERE is_active = true
    )
);
