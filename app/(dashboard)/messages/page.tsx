'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Loader2, MessageSquare, Search, Filter } from 'lucide-react'

interface ConversationWithCustomer {
  id: string
  subject: string
  status: string
  last_message_at: string
  created_at: string
  customer: {
    id: string
    name: string
    email: string
    avatar_url: string | null
  } | null
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user.auth) return
    loadConversations()
  }, [user.auth, statusFilter])

  const loadConversations = async () => {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          customer:store_customers!inner(
            id,
            name,
            email,
            avatar_url
          )
        `)
        .order('last_message_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading conversations:', error)
        return
      }

      setConversations(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase()
    return (
      conv.subject.toLowerCase().includes(searchLower) ||
      conv.customer?.name?.toLowerCase().includes(searchLower) ||
      conv.customer?.email?.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!user.auth) return null

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-2 md:gap-3">
          <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold">Messages</h1>
        </div>
      </div>

      {/* Filters - Mobile responsive */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 md:pl-10 text-sm md:text-base py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto text-sm md:text-base py-2"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-10 md:py-12">
          <MessageSquare className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
          <p className="text-muted-foreground text-sm md:text-base">No conversations yet</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Customers will send you product sourcing requests here
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden -mx-4 md:mx-0">
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className="block p-3 md:p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Mobile card layout */}
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {conversation.customer?.avatar_url ? (
                      <img
                        src={conversation.customer.avatar_url}
                        alt={conversation.customer.name}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm md:text-lg font-semibold text-primary">
                        {conversation.customer?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {conversation.subject}
                      </h3>
                      <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatDate(conversation.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {conversation.customer?.name || 'Unknown Customer'}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate hidden md:block">
                      {conversation.customer?.email}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${
                      conversation.status === 'open'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {conversation.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
