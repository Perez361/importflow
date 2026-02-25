'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Loader2, ArrowLeft, Send, Image, X, Check, User } from 'lucide-react'

interface Message {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'importer'
  sender_id: string
  content: string
  image_url: string | null
  is_read: boolean
  created_at: string
}

interface Conversation {
  id: string
  subject: string
  status: string
  last_message_at: string
  customer: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  } | null
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const supabase = createClient()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!user.auth || !conversationId) return
    loadConversation()
    loadMessages()
  }, [user.auth, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        customer:store_customers(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('id', conversationId)
      .single()

    if (error) {
      console.error('Error loading conversation:', error)
      return
    }

    setConversation(data)
  }

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      return
    }

    setMessages(data || [])
    
    // Mark messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'customer')
      .eq('is_read', false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || !conversation) return

    setSending(true)
    try {
      let imageUrl: string | null = null

      // Upload image if selected
      if (selectedImage) {
        const fileName = `messages/${conversation.id}/${Date.now()}_${selectedImage.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-images')
          .upload(fileName, selectedImage)

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          setSending(false)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('message-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Insert message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'importer',
          sender_id: user.auth?.id,
          content: newMessage.trim(),
          image_url: imageUrl,
        })

      if (messageError) {
        console.error('Error sending message:', messageError)
        setSending(false)
        return
      }

      // Clear form
      setNewMessage('')
      removeImage()
      
      // Reload messages
      loadMessages()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSending(false)
    }
  }

  const handleCloseConversation = async () => {
    if (!conversation) return

    const { error } = await supabase
      .from('conversations')
      .update({ status: 'closed' })
      .eq('id', conversation.id)

    if (!error) {
      loadConversation()
    }
  }

  const handleReopenConversation = async () => {
    if (!conversation) return

    const { error } = await supabase
      .from('conversations')
      .update({ status: 'open' })
      .eq('id', conversation.id)

    if (!error) {
      loadConversation()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (!user.auth) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/messages"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{conversation?.subject}</h1>
            <p className="text-sm text-muted-foreground">
              {conversation?.customer?.name} • {conversation?.customer?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation?.status === 'open' ? (
            <button
              onClick={handleCloseConversation}
              className="btn btn-outline btn-sm"
            >
              Close Conversation
            </button>
          ) : (
            <button
              onClick={handleReopenConversation}
              className="btn btn-outline btn-sm"
            >
              Reopen Conversation
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="card p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'importer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_type === 'importer'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {/* Sender Info */}
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {message.sender_type === 'importer' ? 'You' : conversation?.customer?.name}
                  </span>
                </div>

                {/* Image */}
                {message.image_url && (
                  <div className="mb-2">
                    <img
                      src={message.image_url}
                      alt="Attached image"
                      className="max-w-full rounded-lg"
                    />
                  </div>
                )}

                {/* Content */}
                <p className="text-sm">{message.content}</p>

                {/* Timestamp */}
                <p className={`text-xs mt-1 ${
                  message.sender_type === 'importer' 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground'
                }`}>
                  {formatDate(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Form */}
      {conversation?.status === 'open' && (
        <form onSubmit={handleSendMessage} className="card p-4">
          <div className="space-y-4">
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <label className="btn btn-outline btn-sm cursor-pointer">
                <Image className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={sending || (!newMessage.trim() && !selectedImage)}
                className="btn btn-primary"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
