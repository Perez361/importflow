'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Customer } from '@/types/database'
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Pagination component
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Mobile Customer Card
function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-foreground">{customer.name}</h3>
            <p className="text-sm text-muted-foreground">{customer.email || 'No email'}</p>
          </div>
        </div>
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="font-semibold text-foreground">{formatCurrency(customer.total_spent)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Orders</p>
          <p className="font-semibold text-foreground">{customer.total_orders}</p>
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const { user, loading: authLoading } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()
  const itemsPerPage = 10
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const fetchCustomers = useCallback(async () => {
    if (!user?.profile?.importer_id) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('importer_id', user.profile.importer_id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, error, count } = await query

      if (!error && data) {
        setCustomers(data as Customer[])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.profile?.importer_id, supabase, currentPage, searchQuery])

  useEffect(() => {
    if (!authLoading && user?.profile?.importer_id) {
      fetchCustomers()
    }
  }, [user, authLoading, fetchCustomers])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const stats = {
    total: totalCount,
    totalSpent: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    totalOrders: customers.reduce((sum, c) => sum + (c.total_orders || 0), 0),
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user.auth) {
    return null
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">
            Manage your customer database
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition touch-manipulation">
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Total</p>
            </div>
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{formatCurrency(stats.totalSpent)}</p>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Revenue</p>
            </div>
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{stats.totalOrders}</p>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 md:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-6 md:p-8 text-center">
            <Users className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mx-auto" />
            <p className="mt-4 text-muted-foreground">
              {searchQuery 
                ? 'No customers match your search.' 
                : 'No customers yet. Customers will appear here when they place orders.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {customers.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total Spent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Joined</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{customer.email || '-'}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{customer.phone || '-'}</td>
                      <td className="px-4 py-4 text-sm text-foreground font-medium">{customer.total_orders}</td>
                      <td className="px-4 py-4 text-sm text-foreground font-medium">{formatCurrency(customer.total_spent)}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/customers/${customer.id}`} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg touch-manipulation">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg touch-manipulation">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg touch-manipulation">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

