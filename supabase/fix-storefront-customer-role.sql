-- =====================================================
-- IMMEDIATE FIX: Storefront Customer Role Issue
-- =====================================================
-- Run this script in Supabase SQL Editor to fix existing users
-- and prevent future storefront customers from getting importer role

-- =====================================================
-- PART 1: Fix the trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$ 
DECLARE
    business_name_val TEXT;
    full_name_val TEXT;
    base_slug TEXT;
    final_slug TEXT;
    trial_end TIMESTAMPTZ;
    slug_exists BOOLEAN;
    is_storefront_customer BOOLEAN;
BEGIN
    -- Check if this is a storefront customer registration
    is_storefront_customer := COALESCE((NEW.raw_user_meta_data->>'is_storefront_customer')::BOOLEAN, FALSE);
    
    -- If this is a storefront customer, skip creating importer and user records
    -- The storefront confirm route will handle creating the store_customer and user with 'customer' role
    IF is_storefront_customer THEN
        RAISE NOTICE 'Storefront customer detected - skipping importer/user creation in trigger';
        RETURN NEW;
    END IF;
    
    -- Get business name and full name from user metadata
    business_name_val := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business');
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    
    -- Generate unique slug from business name
    base_slug := lower(regexp_replace(business_name_val, '[^a-zA-Z0-9]', '-', 'g'));
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Default to base slug
    final_slug := base_slug;
    
    -- Check if slug exists and make it unique
    SELECT EXISTS(SELECT 1 FROM public.importers WHERE slug = base_slug) INTO slug_exists;
    
    IF slug_exists THEN
        final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
    END IF;
    
    -- Calculate trial end date (14 days from now)
    trial_end := NOW() + INTERVAL '14 days';
    
    -- Insert into importers table
    INSERT INTO public.importers (id, business_name, slug, email, subscription_status, trial_ends_at)
    VALUES (
        NEW.id,
        business_name_val,
        final_slug,
        NEW.email,
        'trial',
        trial_end
    );
    
    -- Insert into users table with 'importer' role
    INSERT INTO public.users (id, email, full_name, role, importer_id)
    VALUES (
        NEW.id,
        NEW.email,
        full_name_val,
        'importer',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 2: Fix existing storefront customers with incorrect roles
-- =====================================================

-- First, identify users who have store_customer records but have 'importer' role
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

-- =====================================================
-- PART 3: Verify and show results
-- =====================================================

-- Show users who still have importer role but have store_customer records (should be 0)
SELECT 
    'Incorrect role (should be customer)' as issue,
    COUNT(*) as count
FROM users u
INNER JOIN store_customers sc ON sc.auth_id = u.id
WHERE u.role = 'importer';

-- Show correct storefront customers
SELECT 
    'Correctly assigned customer role' as status,
    COUNT(*) as count
FROM users u
INNER JOIN store_customers sc ON sc.auth_id = u.id
WHERE u.role = 'customer';

-- Show users without store_customer records who have importer role (correct)
SELECT 
    'Importer users (correct - no store_customer)' as status,
    COUNT(*) as count
FROM users u
LEFT JOIN store_customers sc ON sc.auth_id = u.id
WHERE u.role = 'importer' AND sc.id IS NULL;

