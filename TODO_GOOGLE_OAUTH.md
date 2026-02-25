# Google OAuth Implementation Plan

## Task: Add Google OAuth to all sign-in and sign-up forms

### Status: Completed (Main Auth)

## Completed Files:

### 1. Main Auth (Importer/Staff) ✅
- [x] `app/(auth)/login/page.tsx` - Added Google OAuth button
- [x] `app/(auth)/register/page.tsx` - Added Google OAuth button  
- [x] `app/auth/callback/route.ts` - Created OAuth callback handler

### 2. Storefront Auth - Pending
- [ ] `app/(storefront)/store/[slug]/login/page.tsx` - Needs Google OAuth
- [ ] `app/(storefront)/store/[slug]/register/page.tsx` - Needs Google OAuth

### 3. Super Admin Auth - Pending
- [ ] `app/(super-admin)/admin/login/page.tsx` - Needs Google OAuth
- [ ] `app/(super-admin)/admin/register/page.tsx` - Needs Google OAuth

## Implementation Notes:
- Used Google brand colors (#4285F4, #EA4335, #FBBC05, #34A853)
- Each auth context has its own callback URL
- For register forms, Google signup will automatically create the user
- Added GoogleIcon component to each form
- Added handleGoogleSignIn/handleGoogleSignUp functions
- Added Google OAuth button with loading state
