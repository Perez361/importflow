-- Pre-Order System Migration
-- Adds tracking numbers and payment status tracking

-- 1. Add supplier tracking number to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_tracking_number TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false;

-- 2. Add payment tracking to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- 3. Add index for tracking number lookups
CREATE INDEX IF NOT EXISTS idx_products_supplier_tracking ON products(supplier_tracking_number);
CREATE INDEX IF NOT EXISTS idx_products_is_preorder ON products(is_preorder);

-- 4. Add payment_status to orders (aggregate status)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- 5. Create preorder_tracking table for cross-checking shipments
CREATE TABLE IF NOT EXISTS preorder_tracking (
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

CREATE INDEX IF NOT EXISTS idx_preorder_tracking_importer ON preorder_tracking(importer_id);
CREATE INDEX IF NOT EXISTS idx_preorder_tracking_tracking ON preorder_tracking(tracking_number);

-- RLS for preorder_tracking
ALTER TABLE preorder_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own importer preorder_tracking"
ON preorder_tracking FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert own importer preorder_tracking"
ON preorder_tracking FOR INSERT
WITH CHECK (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own importer preorder_tracking"
ON preorder_tracking FOR UPDATE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Add is_verified column to shipment_items for tracking verification
ALTER TABLE shipment_items ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE shipment_items ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
