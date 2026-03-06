# Customer Role Fix - Implementation Plan

## Problem Statement
When a customer creates an account on the storefront slug, they are not assigned the "customer" role in the database. Instead:
- They're assigned "importer" role automatically
- Customer account creation fails
- They can login elsewhere (dashboard) instead of being restricted to storefront only

## Root Cause Analysis
The issue is in the email confirmation flow:

1. **Registration**: Customer registers at `/store/[slug]/register` with email/password
2. **Confirmation Email**: Supabase sends confirmation email with redirect to `/store/[slug]/auth/callback`
3. **BUT**: The actual confirmation link goes to `/auth/confirm` (generic), NOT the storefront callback
4. **Result**: `/auth/confirm` has no storefront context, creates user with 'importer' role (or fails), no `store_customers` record is created

## Solution Plan - COMPLETED ✅

### Step 1: Modified Storefront Registration ✅
Modified `/app/(storefront)/store/[slug]/register/page.tsx` to pass the store slug in the user metadata:
```typescript
options: {
  data: {
    name: formData.name,
    phone: formData.phone || null,
    address: formData.address || null,
    city: formData.city || null,
    importer_id: importerId,
    // Pass the store slug to identify this as a storefront registration
    store_slug: slug,
    is_storefront_customer: true,
  },
  emailRedirectTo: redirectUrl,
},
```

### Step 2: Modified Generic Confirm Page ✅
Modified `/app/auth/confirm/page.tsx` to:
1. Detect if this is a storefront confirmation (via user_metadata)
2. Create `store_customers` record if needed
3. Create/update `users` table with role = 'customer'
4. Redirect to storefront login page with success message

### Step 3: Modified Storefront Login Page ✅
Modified `/app/(storefront)/store/[slug]/login/page.tsx` to:
1. Handle `confirmed=true` query parameter
2. Display success message after email confirmation

## Files Modified:
1. `importflow/app/(storefront)/store/[slug]/register/page.tsx` - Added store_slug to registration metadata
2. `importflow/app/auth/confirm/page.tsx` - Handle storefront confirmation properly
3. `importflow/app/(storefront)/store/[slug]/login/page.tsx` - Show success message after confirmation

## How It Works Now:
1. Customer registers on storefront with email/password
2. Registration passes `store_slug` and `is_storefront_customer: true` in user metadata
3. When user confirms email via `/auth/confirm`, it detects the storefront context
4. The confirm page:
   - Creates/updates `store_customers` record for that store
   - Creates/updates `users` table with role = 'customer'
   - Signs out of Supabase session (customer uses localStorage)
   - Redirects to storefront login with `?confirmed=true`
5. Customer can now login to storefront only (not dashboard)

## Testing Checklist:
- [x] Register new customer with email/password on storefront
- [x] Confirm email via link
- [x] Verify user has 'customer' role in users table
- [x] Verify store_customers record exists
- [x] Verify customer can login to storefront only
- [x] Verify customer CANNOT login to dashboard

