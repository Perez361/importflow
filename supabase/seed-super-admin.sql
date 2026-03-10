-- Super Admin Seed Script
-- Run this SQL after creating the user in Supabase Authentication
-- 
-- STEP 1: Create user in Supabase Dashboard → Authentication → Users → Add user
-- STEP 2: Copy the user's UUID from the Authentication table
-- STEP 3: Update the INSERT statement below with that UUID
-- STEP 4: Run this SQL script

-- Replace 'USER_UUID_HERE' with the actual UUID from Supabase Authentication
-- Example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

INSERT INTO users (id, email, full_name, role, is_active)
VALUES (
  'USER_UUID_HERE',  -- Replace with actual UUID from Supabase Authentication
  'admin@example.com', 
  'Super Admin', 
  'super_admin', 
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  is_active = true;

