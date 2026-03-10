-- ============================================
-- Fix: User Signup Trigger Permissions
-- This migration ensures the trigger function can properly insert users
-- Run this in your Supabase SQL Editor
-- ============================================

-- First, grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO authenticated;

-- Also grant permission to anon in case it's needed
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO anon;

-- Make sure the function can insert into users table
-- The function uses SECURITY DEFINER so it should work, but let's verify

-- Re-create the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_signup();

-- If you want to manually create a test user (for debugging), run:
-- INSERT INTO users (id, email, full_name, role, is_active)
-- VALUES (
--   'test-user-uuid-here',
--   'test@example.com',
--   'Test User',
--   'importer',
--   true
-- );

-- If you need to check existing users, run:
-- SELECT * FROM users;

