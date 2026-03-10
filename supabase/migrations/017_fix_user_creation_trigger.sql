-- ============================================
-- Fix: Ensure User Creation Trigger Works
-- Run this in your Supabase SQL Editor
-- ============================================

-- First, check if the function exists
-- If it doesn't exist, create it

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create user record if it doesn't exist
    INSERT INTO public.users (id, email, full_name, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'business_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO service_role;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_signup();

-- Test: Check if trigger exists
-- SELECT tgname, proname, prosrc FROM pg_trigger t 
-- JOIN pg_proc p ON t.tgfoid = p.oid 
-- WHERE tgname = 'on_auth_user_created';

