-- Fix RLS circular dependency for users table
-- The super admin policy was causing circular dependency issues

-- Drop the problematic policies
DROP POLICY IF EXISTS "Super admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own importer users" ON users;
DROP POLICY IF EXISTS "Users can view self" ON users;

-- Create new policies that avoid circular dependency

-- Policy 1: Users can always view themselves (no circular dependency)
CREATE POLICY "Users can view self"
ON users FOR SELECT
USING (id = auth.uid());

-- Policy 2: Super admins can view all users
-- Use a security definer function to avoid circular dependency
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Super admins can view all users"
ON users FOR SELECT
USING (is_super_admin());

-- Policy 3: Users can view other users in their importer
CREATE POLICY "Users can view own importer users"
ON users FOR SELECT
USING (
    importer_id IS NOT NULL 
    AND importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid() AND importer_id IS NOT NULL
    )
);

-- Drop and recreate insert policies
DROP POLICY IF EXISTS "Super admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own user during registration" ON users;

-- Policy 4: Super admins can insert users
CREATE POLICY "Super admins can insert users"
ON users FOR INSERT
WITH CHECK (is_super_admin());

-- Policy 5: Users can insert their own user during registration
CREATE POLICY "Users can insert own user during registration"
ON users FOR INSERT
WITH CHECK (id = auth.uid());

-- Drop and recreate update policy
DROP POLICY IF EXISTS "Users can update self" ON users;

-- Policy 6: Users can update themselves
CREATE POLICY "Users can update self"
ON users FOR UPDATE
USING (id = auth.uid());
