-- Run these queries in Supabase SQL Editor to set up a super admin

-- Step 1: Check your current user and role
SELECT id, email, role, full_name FROM users;

-- Step 2: Update your user to be super admin
-- Replace 'your-email@example.com' with your actual email from Step 1
UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';

-- Step 3: Verify the update worked
SELECT id, email, role, full_name FROM users WHERE role = 'super_admin';

-- After running these queries:
-- 1. Log out and log back in (or refresh the page)
-- 2. Navigate to /admin
