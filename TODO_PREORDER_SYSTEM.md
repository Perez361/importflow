# Pre-Order & Tracking System Implementation Plan

## Overview
This plan implements a pre-order system where:
1. Products are uploaded with prices for customers to pre-order via storefront
2. Tracking numbers from suppliers are stored on products
3. Shipping company bills can be cross-checked against stored tracking numbers
4. A buyer tracking page shows products grouped by category with customer pre-orders and payment status

## Database Schema Changes

### 1. Add tracking_number to products table
- New column: `supplier_tracking_number` (TEXT) - tracking from supplier/store
- New column: `is_preorder` (BOOLEAN) - whether product is for pre-order

### 2. Add payment tracking to order_items
- New column: `payment_status` (TEXT) - 'unpaid', 'paid', 'partial'
- New column: `paid_amount` (DECIMAL) - amount paid if partial
- New column: `notes` (TEXT) - any notes about payment

### 3. Create preorder_tracking table (for tracking cross-check)
- id, importer_id, shipment_id, tracking_number, product_id, verified (boolean)

## New/Modified Pages

### 1. Products Page (Update)
- Add fields for supplier_tracking_number
- Add toggle for is_preorder
- Show pre-order status badge

### 2. Shipments Page (Update - Major)
- Add tracking numbers to shipment items
- Cross-check feature: upload/paste tracking numbers from shipping company
- Show which tracking numbers match/mismatch with supplier tracking

### 3. Buyer Tracking Page (New - Priority)
- Route: /buyer-tracking
- Group products by category
- Show list of customers who pre-ordered each product
- Mark customers as paid/not paid
- Show payment summary per product

### 4. Orders Page (Update)
- Better order management with payment status per item
- Show which items have been paid for

## Implementation Steps

### Step 1: Database Migration
- [ ] Create migration 011_preorder_system.sql
- Add supplier_tracking_number to products
- Add is_preorder to products  
- Add payment_status, paid_amount to order_items

### Step 2: Update Product Forms
- [ ] Update products/new/page.tsx to include tracking number field
- [ ] Update products/[id]/page.tsx to show/edit tracking number

### Step 3: Update Orders Page
- [ ] Enhance orders/page.tsx with better UI
- [ ] Add payment status management per order item

### Step 4: Create Buyer Tracking Page
- [ ] Create app/(dashboard)/buyer-tracking/page.tsx
- [ ] Group products by category
- [ ] Show customers who ordered each product
- [ ] Add payment status toggle per customer

### Step 5: Update Shipments Page
- [ ] Add tracking number input to shipment items
- [ ] Create cross-check feature

### Step 6: Update Sidebar
- [ ] Add "Buyer Tracking" menu item

## UI/UX Considerations
- Simple toggle for paid/unpaid status
- Clear visual indicators for payment status
- Group by category for easy tracking
- Search/filter functionality
