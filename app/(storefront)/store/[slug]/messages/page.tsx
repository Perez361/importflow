'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, Send, Image, X, Plus, MessageSquare, User } from 'lucide-react'

interface StoreCustomer {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  avatar_url: string | null
  importer_id: string
}

interface Conversation {
  id: string
  subject: string
  status: 'open' | 'closed'
  last_message_at: string
  created_at: string
}

interface Message {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'importer'
  content: string
  image_url: string | null
  created_at: string
}

export default function StoreMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<StoreCustomer | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [requestSubject, setRequestSubject] = useState('')
  const [requestDescription, setRequestDescription] = useState('')

  useEffect(() => {
    fetchData()
  }, [slug])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchData = async () => {
    try {
      // Get customer session
      const customerSession = localStorage.getItem(`customer_${slug}`)
      
      if (!customerSession) {
        router.push(`/store/${slug}/login?redirect=/store/${slug}/messages`)
        return
      }

      const customerData = JSON.parse(customerSession) as StoreCustomer
      setCustomer(customerData)

      // Load conversations
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('customer_id', customerData.id)
        .order('last_message_at', { ascending: false })

      setConversations(convData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    setMessages(data || [])
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
    if (!newMessage.trim() && !selectedImage || !selectedConversation || !customer) return

    setSending(true)
    try {
      let imageUrl: string | null = null

      // Upload image if selected
      if (selectedImage) {
        const fileName = `messages/${selectedConversation.id}/${Date.now()}_${selectedImage.name}`
        
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
          conversation_id: selectedConversation.id,
          sender_type: 'customer',
          sender_id: customer.id,
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
      loadMessages(selectedConversation.id)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSending(false)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestSubject.trim() || !requestDescription.trim() || !customer) return

    setSending(true)
    try {
      // Get importer_id from slug
      const { data: importerData } = await supabase
        .from('importers')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!importerData) {
        console.error('Importer not found')
        setSending(false)
        return
      }

      // Create conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({
          importer_id: importerData.id,
          customer_id: customer.id,
          subject: requestSubject,
          status: 'open',
        })
        .select()
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        setSending(false)
        return
      }

      // Send initial message with description
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: convData.id,
          sender_type: 'customer',
          sender_id: customer.id,
          content: requestDescription,
          image_url: null,
        })

      if (messageError) {
        console.error('Error sending message:', messageError)
      }

      // Clear form and refresh
      setRequestSubject('')
      setRequestDescription('')
      setShowNewRequest(false)
      fetchData()
      
      // Select new conversation
      setSelectedConversation(convData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/store/${slug}`}
        className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Store
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold">My Messages</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setShowNewRequest(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                New Request
              </button>
            </div>
            
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-zinc-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Request a product sourcing</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700 max-h-[400px] overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{conv.subject}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        conv.status === 'open' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {conv.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(conv.last_message_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="md:col-span-2">
          {showNewRequest ? (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Request Product Sourcing</h2>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    What product are you looking for?
                  </label>
                  <input
                    type="text"
                    value={requestSubject}
                    onChange={(e) => setRequestSubject(e.target.value)}
                    placeholder="e.g., iPhone 15 Pro Max"
                    required
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Describe what you need (quantity, specifications, etc.)
                  </label>
                  <textarea
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    placeholder="Provide details about the product..."
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRequest(false)}
                    className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          ) : selectedConversation ? (
            <>
              <div className="card p-4">
                <h2 className="font-semibold">{selectedConversation.subject}</h2>
              </div>

              <div className="card p-4 space-y-4 max-h-[400px] overflow-y-auto mt-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_type === 'customer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800'
                        }`}
                      >
                        {/* Sender */}
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            {message.sender_type === 'customer' ? 'You' : 'Store'}
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
                          message.sender_type === 'customer' 
                            ? 'text-blue-200' 
                            : 'text-zinc-500'
                        }`}>
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedConversation.status === 'open' && (
                <form onSubmit={handleSendMessage} className="card p-4 mt-4">
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
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
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
            </>
          ) : (
            <div className="card p-6 text-center text-zinc-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation or start a new request</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
