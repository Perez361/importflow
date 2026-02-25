# Super Admin Authentication Implementation

## Task
Create separate login and registration routes for super admin users with different redirect behavior.

## Files to Create:
- [ ] 1. app/(super-admin)/auth/layout.tsx - Auth layout for super admin
- [ ] 2. app/(super-admin)/admin/login/page.tsx - Super admin login page
- [ ] 3. app/(super-admin)/admin/register/page.tsx - Super admin registration page

## Files to Modify:
- [ ] 4. lib/hooks/use-auth.ts - Update signOut to redirect super admins to /admin/login

## Implementation Steps:
1. Create super admin auth layout
2. Create super admin login page
3. Create super admin registration page
4. Modify use-auth hook for proper redirect after sign out
