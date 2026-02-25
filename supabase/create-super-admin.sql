-- Create Super Admin User
-- Run this in Supabase SQL Editor

-- Step 1: First, let's check if you already have an auth user
-- Your auth user ID from the logs is: 0767b9bf-3ade-406a-8c26-8e6861cc58ac
-- Replace the ID below with your actual auth user ID if different

-- Step 2: Create the super admin user record (without an importer_id)
-- This creates a user that is NOT associated with any importer
INSERT INTO users (id, email, full_name, role, importer_id, is_active)
VALUES (
  '0767b9bf-3ade-406a-8c26-8e6861cc58ac',  -- Your auth user ID
  'your-email@example.com',                  -- Replace with your email
  'Super Admin',                             -- Your name
  'super_admin',                             -- Role
  NULL,                                      -- No importer_id for super admins
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  importer_id = NULL;

-- Step 3: Verify the user was created correctly
SELECT id, email, role, importer_id, full_name FROM users WHERE role = 'super_admin';

-- Step 4: Clean up any importer that was incorrectly created for the super admin
-- (Only run this if you registered through the normal flow first)
-- DELETE FROM importers WHERE id = '0767b9bf-3ade-406a-8c26-8e6861cc58ac';

-- After running this:
-- 1. Log out and log back in (or refresh the page)
-- 2. Navigate to /admin
