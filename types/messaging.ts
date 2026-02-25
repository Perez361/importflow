/**
 * Messaging System Types
 * These types are defined manually as the tables are created via migration 010
 */

export type Conversation = {
  id: string
  importer_id: string
  customer_id: string
  subject: string
  status: 'open' | 'closed'
  last_message_at: string
  created_at: string
  updated_at: string
}

export type ConversationInsert = {
  id?: string
  importer_id: string
  customer_id: string
  subject?: string
  status?: string
  last_message_at?: string
  created_at?: string
  updated_at?: string
}

export type ConversationUpdate = {
  id?: string
  importer_id?: string
  customer_id?: string
  subject?: string
  status?: string
  last_message_at?: string
  created_at?: string
  updated_at?: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'importer'
  sender_id: string
  content: string
  image_url: string | null
  is_read: boolean
  created_at: string
}

export type MessageInsert = {
  id?: string
  conversation_id: string
  sender_type: 'customer' | 'importer'
  sender_id: string
  content: string
  image_url?: string | null
  is_read?: boolean
  created_at?: string
}

export type MessageUpdate = {
  id?: string
  conversation_id?: string
  sender_type?: 'customer' | 'importer'
  sender_id?: string
  content?: string
  image_url?: string | null
  is_read?: boolean
  created_at?: string
}

// Conversation with related data
export type ConversationWithCustomer = Conversation & {
  customer?: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  } | null
}

// Message with sender info
export type MessageWithSender = Message & {
  sender_name?: string
}
