-- Migration: Add Messaging System for Customer-Importer Communication
-- This enables customers to send product sourcing requests with images

-- ============================================
-- 1. CONVERSATIONS TABLE
-- ============================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_id UUID NOT NULL REFERENCES importers(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES store_customers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT 'Product Sourcing Request',
    status TEXT NOT NULL DEFAULT 'open',
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_importer_id ON conversations(importer_id);
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ============================================
-- 2. MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'importer')),
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- ============================================
-- 3. UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONVERSATIONS RLS POLICIES
-- ============================================

-- Super admins can see all conversations
CREATE POLICY "Super admins can view all conversations"
ON conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Importers can view their conversations
CREATE POLICY "Importers can view own conversations"
ON conversations FOR SELECT
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- Customers can view their own conversations
CREATE POLICY "Customers can view own conversations"
ON conversations FOR SELECT
USING (
    customer_id IN (
        SELECT id FROM store_customers 
        WHERE auth_id = auth.uid()
    )
);

-- Customers can create conversations
CREATE POLICY "Customers can create conversations"
ON conversations FOR INSERT
WITH CHECK (
    customer_id IN (
        SELECT id FROM store_customers 
        WHERE auth_id = auth.uid()
    )
);

-- Importers can update conversation status
CREATE POLICY "Importers can update conversations"
ON conversations FOR UPDATE
USING (
    importer_id IN (
        SELECT importer_id FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================
-- MESSAGES RLS POLICIES
-- ============================================

-- Super admins can view all messages
CREATE POLICY "Super admins can view all messages"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Importers can view messages in their conversations
CREATE POLICY "Importers can view messages"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- Customers can view their own messages
CREATE POLICY "Customers can view own messages"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE customer_id IN (
            SELECT id FROM store_customers 
            WHERE auth_id = auth.uid()
        )
    )
);

-- Customers can send messages
CREATE POLICY "Customers can send messages"
ON messages FOR INSERT
WITH CHECK (
    sender_type = 'customer'
    AND conversation_id IN (
        SELECT id FROM conversations 
        WHERE customer_id IN (
            SELECT id FROM store_customers 
            WHERE auth_id = auth.uid()
        )
    )
);

-- Importers can send messages
CREATE POLICY "Importers can send messages"
ON messages FOR INSERT
WITH CHECK (
    sender_type = 'importer'
    AND conversation_id IN (
        SELECT id FROM conversations 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- Importers can mark messages as read
CREATE POLICY "Importers can update messages"
ON messages FOR UPDATE
USING (
    conversation_id IN (
        SELECT id FROM conversations 
        WHERE importer_id IN (
            SELECT importer_id FROM users 
            WHERE id = auth.uid()
        )
    )
);

-- ============================================
-- 5. STORAGE BUCKET FOR MESSAGE IMAGES
-- ============================================

-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message images
DROP POLICY IF EXISTS "Anyone can view message images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload message images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own message images" ON storage.objects;

CREATE POLICY "Anyone can view message images"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-images');

CREATE POLICY "Authenticated users can upload message images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'message-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own message images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'message-images' 
    AND auth.role() = 'authenticated'
);

-- ============================================
-- 6. HELPER FUNCTION
-- ============================================

-- Function to get unread message count for a conversation
CREATE OR REPLACE FUNCTION get_unread_message_count(p_conversation_id UUID, p_sender_type TEXT)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER FROM messages
    WHERE conversation_id = p_conversation_id
    AND sender_type != p_sender_type
    AND is_read = false;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_activity_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_activity();
