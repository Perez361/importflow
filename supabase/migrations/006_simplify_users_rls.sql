-- Simplify Users RLS Policies
-- Remove complex policies that might be causing timeouts

-- Drop all existing policies on users
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own importer users" ON users;
DROP POLICY IF EXISTS "Users can view self" ON users;
DROP POLICY IF EXISTS "Super admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own user during registration" ON users;
DROP POLICY IF EXISTS "Users can update self" ON users;

-- Drop all existing policies on importers
DROP POLICY IF EXISTS "Users can insert own importer during registration" ON importers;
DROP POLICY IF EXISTS "Users can insert own importer" ON importers;
DROP POLICY IF EXISTS "Users can view own importer" ON importers;
DROP POLICY IF EXISTS "Users can update own importer" ON importers;

-- Drop the is_super_admin function
DROP FUNCTION IF EXISTS is_super_admin();

-- Create simple policy: Users can view themselves
CREATE POLICY "Users can view self"
ON users FOR SELECT
USING (id = auth.uid());

-- Create simple policy: Users can update themselves
CREATE POLICY "Users can update self"
ON users FOR UPDATE
USING (id = auth.uid());

-- Create simple policy: Users can insert themselves (for registration)
CREATE POLICY "Users can insert self"
ON users FOR INSERT
WITH CHECK (id = auth.uid());

-- For super admin access, we'll use service role or a separate approach
-- For now, super admins will need to use the Supabase dashboard to manage users

-- Allow users to insert their own importer during registration
CREATE POLICY "Users can insert own importer"
ON importers FOR INSERT
WITH CHECK (id = auth.uid());

-- Allow users to view their own importer
CREATE POLICY "Users can view own importer"
ON importers FOR SELECT
USING (id = auth.uid());

-- Allow users to update their own importer
CREATE POLICY "Users can update own importer"
ON importers FOR UPDATE
USING (id = auth.uid());
