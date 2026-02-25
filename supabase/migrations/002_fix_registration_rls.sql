-- Fix Registration RLS Policies
-- This migration adds policies to allow new users to create their own records during registration

-- ============================================
-- FIX IMPORTERS RLS POLICIES
-- ============================================

-- Allow authenticated users to insert their own importer record during registration
-- The importer id must match their auth.uid()
CREATE POLICY "Users can insert own importer during registration"
ON importers FOR INSERT
WITH CHECK (id = auth.uid());

-- ============================================
-- FIX USERS RLS POLICIES  
-- ============================================

-- Allow authenticated users to insert their own user record during registration
-- The user id must match their auth.uid()
CREATE POLICY "Users can insert own user during registration"
ON users FOR INSERT
WITH CHECK (id = auth.uid());

-- ============================================
-- HELPER FUNCTION FOR REGISTRATION
-- ============================================

-- Create a function to handle user registration
-- This runs with elevated privileges to bypass RLS during registration
-- IMPORTANT: Use public. schema prefix for all table references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    business_name_val TEXT;
    full_name_val TEXT;
    base_slug TEXT;
    final_slug TEXT;
    trial_end TIMESTAMPTZ;
    slug_exists BOOLEAN;
BEGIN
    -- Get business name and full name from user metadata
    business_name_val := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business');
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    
    -- Generate unique slug from business name
    base_slug := lower(regexp_replace(business_name_val, '[^a-zA-Z0-9]', '-', 'g'));
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Default to base slug
    final_slug := base_slug;
    
    -- Check if slug exists and make it unique (using SECURITY DEFINER bypasses RLS)
    SELECT EXISTS(SELECT 1 FROM public.importers WHERE slug = base_slug) INTO slug_exists;
    
    IF slug_exists THEN
        -- Append random suffix if slug exists
        final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
    END IF;
    
    -- Calculate trial end date (14 days from now)
    trial_end := NOW() + INTERVAL '14 days';
    
    -- Insert into importers table (with public. schema prefix)
    INSERT INTO public.importers (id, business_name, slug, email, subscription_status, trial_ends_at)
    VALUES (
        NEW.id,
        business_name_val,
        final_slug,
        NEW.email,
        'trial',
        trial_end
    );
    
    -- Insert into users table (with public. schema prefix)
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

-- Create trigger to automatically handle new user registration
-- This trigger fires after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();