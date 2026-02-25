// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  IMPORTER: 'importer',
  STAFF: 'staff',
  CUSTOMER: 'customer',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// Payment status
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
} as const

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partially Paid',
  paid: 'Paid',
}

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
} as const

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
}

// Shipment status
export const SHIPMENT_STATUS = {
  PREPARING: 'preparing',
  IN_TRANSIT: 'in_transit',
  CUSTOMS: 'customs',
  ARRIVED: 'arrived',
  DELIVERED: 'delivered',
} as const

export type ShipmentStatus = typeof SHIPMENT_STATUS[keyof typeof SHIPMENT_STATUS]

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  preparing: 'Preparing',
  in_transit: 'In Transit',
  customs: 'In Customs',
  arrived: 'Arrived',
  delivered: 'Delivered',
}

// Subscription status
export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS]

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Active',
  past_due: 'Past Due',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]

export interface PlanDetails {
  name: string
  price: number
  billingCycle: 'monthly' | 'yearly'
  features: {
    maxProducts: number | null // null = unlimited
    maxStaff: number | null
    hasAnalytics: boolean
    hasApi: boolean
    hasPrioritySupport: boolean
  }
}

export const PLAN_DETAILS: Record<SubscriptionPlan, PlanDetails> = {
  starter: {
    name: 'Starter',
    price: 0,
    billingCycle: 'monthly',
    features: {
      maxProducts: 50,
      maxStaff: 1,
      hasAnalytics: false,
      hasApi: false,
      hasPrioritySupport: false,
    },
  },
  professional: {
    name: 'Professional',
    price: 299,
    billingCycle: 'monthly',
    features: {
      maxProducts: 500,
      maxStaff: 5,
      hasAnalytics: true,
      hasApi: false,
      hasPrioritySupport: false,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 999,
    billingCycle: 'monthly',
    features: {
      maxProducts: null,
      maxStaff: null,
      hasAnalytics: true,
      hasApi: true,
      hasPrioritySupport: true,
    },
  },
}

// Trial period in days
export const TRIAL_PERIOD_DAYS = 14

// Currency
export const DEFAULT_CURRENCY = 'GHS'
export const CURRENCY_SYMBOL = '₵'

// Countries for import origins
export const COMMON_IMPORT_ORIGINS = [
  'China',
  'Dubai (UAE)',
  'Turkey',
  'India',
  'United Kingdom',
  'United States',
  'Germany',
  'Netherlands',
  'Vietnam',
  'Bangladesh',
] as const
