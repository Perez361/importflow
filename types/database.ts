export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      importers: {
        Row: {
          id: string
          business_name: string
          slug: string
          email: string
          phone: string | null
          logo_url: string | null
          address: string | null
          city: string | null
          country: string
          currency: string
          is_active: boolean
          subscription_status: string
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          slug: string
          email: string
          phone?: string | null
          logo_url?: string | null
          address?: string | null
          city?: string | null
          country?: string
          currency?: string
          is_active?: boolean
          subscription_status?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          slug?: string
          email?: string
          phone?: string | null
          logo_url?: string | null
          address?: string | null
          city?: string | null
          country?: string
          currency?: string
          is_active?: boolean
          subscription_status?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          importer_id: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          importer_id?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          importer_id?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          importer_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          total_orders: number
          total_spent: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          importer_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          total_orders?: number
          total_spent?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          importer_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          total_orders?: number
          total_spent?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      store_customers: {
        Row: {
          id: string
          importer_id: string
          email: string
          password_hash: string | null
          name: string
          phone: string | null
          address: string | null
          city: string | null
          avatar_url: string | null
          auth_id: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          importer_id: string
          email: string
          password_hash?: string | null
          name: string
          phone?: string | null
          address?: string | null
          city?: string | null
          avatar_url?: string | null
          auth_id?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          importer_id?: string
          email?: string
          password_hash?: string | null
          name?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          avatar_url?: string | null
          auth_id?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          importer_id: string
          name: string
          description: string | null
          sku: string | null
          category: string | null
          image_url: string | null
          cost_price: number | null
          selling_price: number
          quantity: number
          low_stock_threshold: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          importer_id: string
          name: string
          description?: string | null
          sku?: string | null
          category?: string | null
          image_url?: string | null
          cost_price?: number | null
          selling_price: number
          quantity?: number
          low_stock_threshold?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          importer_id?: string
          name?: string
          description?: string | null
          sku?: string | null
          category?: string | null
          image_url?: string | null
          cost_price?: number | null
          selling_price?: number
          quantity?: number
          low_stock_threshold?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          importer_id: string
          customer_id: string | null
          order_number: string
          status: string
          payment_status: string
          subtotal: number
          total: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          importer_id: string
          customer_id?: string | null
          order_number: string
          status?: string
          payment_status?: string
          subtotal: number
          total: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          importer_id?: string
          customer_id?: string | null
          order_number?: string
          status?: string
          payment_status?: string
          subtotal?: number
          total?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      shipments: {
        Row: {
          id: string
          importer_id: string
          shipment_number: string
          origin: string
          destination: string
          status: string
          shipping_cost: number | null
          customs_cost: number | null
          other_costs: number | null
          estimated_arrival: string | null
          actual_arrival: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          importer_id: string
          shipment_number: string
          origin: string
          destination: string
          status?: string
          shipping_cost?: number | null
          customs_cost?: number | null
          other_costs?: number | null
          estimated_arrival?: string | null
          actual_arrival?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          importer_id?: string
          shipment_number?: string
          origin?: string
          destination?: string
          status?: string
          shipping_cost?: number | null
          customs_cost?: number | null
          other_costs?: number | null
          estimated_arrival?: string | null
          actual_arrival?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shipment_items: {
        Row: {
          id: string
          shipment_id: string
          product_id: string | null
          quantity: number
          unit_cost: number | null
          total_cost: number | null
          created_at: string
        }
        Insert: {
          id?: string
          shipment_id: string
          product_id?: string | null
          quantity: number
          unit_cost?: number | null
          total_cost?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          shipment_id?: string
          product_id?: string | null
          quantity?: number
          unit_cost?: number | null
          total_cost?: number | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          importer_id: string
          order_id: string | null
          customer_id: string | null
          amount: number
          payment_method: string | null
          reference: string | null
          status: string
          paid_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          importer_id: string
          order_id?: string | null
          customer_id?: string | null
          amount: number
          payment_method?: string | null
          reference?: string | null
          status?: string
          paid_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          importer_id?: string
          order_id?: string | null
          customer_id?: string | null
          amount?: number
          payment_method?: string | null
          reference?: string | null
          status?: string
          paid_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          importer_id: string
          plan: string
          status: string
          price: number
          billing_cycle: string
          current_period_start: string | null
          current_period_end: string | null
          paystack_subscription_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          importer_id: string
          plan: string
          status?: string
          price: number
          billing_cycle?: string
          current_period_start?: string | null
          current_period_end?: string | null
          paystack_subscription_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          importer_id?: string
          plan?: string
          status?: string
          price?: number
          billing_cycle?: string
          current_period_start?: string | null
          current_period_end?: string | null
          paystack_subscription_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types for table rows
export type Importer = Database['public']['Tables']['importers']['Row']
export type ImporterInsert = Database['public']['Tables']['importers']['Insert']
export type ImporterUpdate = Database['public']['Tables']['importers']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type StoreCustomer = Database['public']['Tables']['store_customers']['Row']
export type StoreCustomerInsert = Database['public']['Tables']['store_customers']['Insert']
export type StoreCustomerUpdate = Database['public']['Tables']['store_customers']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

export type Shipment = Database['public']['Tables']['shipments']['Row']
export type ShipmentInsert = Database['public']['Tables']['shipments']['Insert']
export type ShipmentUpdate = Database['public']['Tables']['shipments']['Update']

export type ShipmentItem = Database['public']['Tables']['shipment_items']['Row']
export type ShipmentItemInsert = Database['public']['Tables']['shipment_items']['Insert']
export type ShipmentItemUpdate = Database['public']['Tables']['shipment_items']['Update']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

// Messaging System Types - See types/messaging.ts
export * from './messaging'

// Extended types with relationships
export type OrderWithItems = Order & {
  order_items: OrderItem[]
  customer?: Customer | null
}

export type ProductWithImporter = Product & {
  importer: Importer
}

export type UserWithImporter = User & {
  importer?: Importer | null
}

// Conversation with related data
export type ConversationWithCustomer = Conversation & {
  customer?: StoreCustomer | null
}

// Message with sender info
export type MessageWithSender = Message & {
  sender_name?: string
}
