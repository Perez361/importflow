import { z } from 'zod'

// Common validation patterns
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
const urlRegex = /^https?:\/\/.+/

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  business_name: z.string().min(2, 'Business name is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Product schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  sku: z.string().max(50, 'SKU too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  cost_price: z.coerce.number().min(0, 'Cost price must be positive').optional(),
  selling_price: z.coerce.number().min(0, 'Selling price must be positive'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be 0 or more'),
  low_stock_threshold: z.coerce.number().int().min(0, 'Threshold must be 0 or more'),
  is_available: z.boolean().default(true),
  is_preorder: z.boolean().default(false),
  supplier_tracking_number: z.string().max(100).optional(),
})

export const productUpdateSchema = productSchema.partial()

// Customer schemas
export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200, 'Name too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional().or(z.literal('')),
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().max(100, 'City name too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// Order schemas
export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  payment_status: z.enum(['pending', 'paid', 'partial', 'refunded']).optional(),
  notes: z.string().max(1000).optional(),
})

// Importer/Store schemas
export const importerSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().min(1, 'Country is required').default('Ghana'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('GHS'),
  logo_url: z.string().url().optional().or(z.literal('')),
})

// User profile schemas
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name too short').max(200, 'Name too long').optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone').optional().or(z.literal('')),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

// Shipment schemas
export const shipmentSchema = z.object({
  shipment_number: z.string().min(1, 'Shipment number required').max(50),
  origin: z.string().min(1, 'Origin is required').max(200),
  destination: z.string().min(1, 'Destination is required').max(200),
  status: z.enum(['pending', 'in_transit', 'delivered', 'cancelled']).default('pending'),
  shipping_cost: z.coerce.number().min(0).optional(),
  customs_cost: z.coerce.number().min(0).optional(),
  other_costs: z.coerce.number().min(0).optional(),
  estimated_arrival: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

// Validation helper function
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors: Record<string, string> = {}
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = issue.message
    }
  })
  
  return { success: false, errors }
}

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>
export type ImporterInput = z.infer<typeof importerSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ShipmentInput = z.infer<typeof shipmentSchema>

