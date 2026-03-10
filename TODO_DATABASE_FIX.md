# Database Fix - Implementation Steps

## Overview
This document outlines the steps to fix the database relationships and resolve the login/logout session conflicts.

## Problem Being Fixed
1. Users logging in as one type (importer/staff, store customer, or super admin) was logging out other users
2. Database relationships were not properly established
3. Session conflicts between different user types

## Solution Implemented
1. Created a complete new database schema with proper relationships
2. Updated authentication hooks to handle different user types separately
3. Store customers now use localStorage for session (instead of Supabase auth cookies)
4. Importer staff and super admins use Supabase auth sessions

---

## Steps to Complete

### Step 1: Run the Database Migration
⚠️ **WARNING: This will delete all existing data!** 

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/015_complete_schema_reset.sql`
4. Run the migration

### Step 2: Create Super Admin User
After the migration runs, you need to create a super admin:

1. Go to your app's registration page: `/admin/register`
2. Register a new account (e.g., `admin@importflow.app`)
3. Go to Supabase Dashboard → Authentication → Users
4. Find the user you just created
5. Go to the SQL Editor and run:
```sql
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'admin@importflow.app';
```

### Step 3: Create Importers (Businesses)
1. Login to the super admin dashboard at `/admin`
2. Create new importers (businesses) through the dashboard
3. Each importer will get their own storefront at `/store/[slug]`

### Step 4: Create Importer Staff
1. Login as an importer through `/login`
2. Go to Settings → Team to invite staff members
3. Staff will login through `/login` and be redirected to `/dashboard`

### Step 5: Test Storefront Customers
1. Visit a storefront at `/store/[slug]`
2. Click "Register" to create a customer account
3. Customers login through `/store/[slug]/login`
4. Customers are redirected to `/store/[slug]/account`

---

## How Login Flow Works Now

### Super Admin Login
- **Login URL**: `/admin/login`
- **Redirect after login**: `/admin`
- **Session**: Supabase Auth cookies

### Importer/Staff Login
- **Login URL**: `/login`
- **Redirect after login**: `/dashboard`
- **Session**: Supabase Auth cookies

### Store Customer Login
- **Login URL**: `/store/[slug]/login`
- **Redirect after login**: `/store/[slug]/account`
- **Session**: localStorage (not Supabase Auth cookies)
- **Why**: Prevents session conflicts with dashboard users

---

## Key Changes Made

### Database Schema (`supabase/migrations/015_complete_schema_reset.sql`)
- Dropped all existing tables
- Recreated with proper foreign key relationships:
  - `users` → links to `auth.users` via `id` (same UUID)
  - `store_customers` → links to `auth.users` via `auth_id` (separate column)
  - `orders` → now has both `customer_id` and `store_customer_id`
- Proper RLS policies for each user type

### Authentication Hooks
- `lib/hooks/use-auth.ts` - For importer/super admin auth
- `lib/hooks/use-store-customer-auth.ts` - NEW, for storefront customer auth

### Frontend Updates
- `app/(storefront)/store/[slug]/login/page.tsx` - Updated for new schema
- `app/(storefront)/store/[slug]/account/page.tsx` - Uses `store_customer_id`
- `app/(storefront)/store/[slug]/auth/callback/route.ts` - Updated for new schema
- `types/database.ts` - Updated types to match new schema

---

## Troubleshooting

### If customers still can't login:
1. Check that the `store_customers` table has the correct `auth_id`
2. Verify RLS policies allow SELECT for the customer

### If dashboard users can't login:
1. Check that the `users` table has records with matching `id` to `auth.users`
2. Verify the user has a valid `role` (super_admin, importer, or staff)

### If sessions conflict:
1. Clear browser cookies and localStorage
2. Log out and log back in
3. Make sure you're using the correct login URL for your user type

