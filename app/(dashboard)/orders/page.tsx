'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Order, Customer } from '@/types/database'
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from 'lucide-react'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded'

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock },
  confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: CheckCircle },
  processing: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', icon: Package },
  shipped: { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', icon: Truck },
  delivered: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', icon: XCircle },
}

const paymentStatusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' },
  paid: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
  partial: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
  refunded: { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400' },
}

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

// Mobile Order Card
function OrderCard({ 
  order, 
  customer,
  onStatusChange,
  onView 
}: { 
  order: Order
  customer: Customer | null
  onStatusChange: (id: string, status: string) => void
  onView: (id: string) => void
}) {
  const config = statusConfig[order.status] || statusConfig.pending
  const paymentConfig = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending
  const StatusIcon = config.icon

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/orders/${order.id}`} className="font-medium text-foreground hover:text-primary">
            {order.order_number}
          </Link>
          <p className="text-sm text-muted-foreground">{customer?.name || 'Unknown Customer'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onView(order.id)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
          <StatusIcon className="h-3 w-3" />
          {order.status}
        </span>
        <span className={`inline-flex px-2 py-1 rounded-full ${paymentConfig.bg} ${paymentConfig.text}`}>
          {order.payment_status}
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <p className="font-semibold text-foreground">{formatCurrency(order.total)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <select
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          className="text-xs input py-1 px-2"
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Record<string, Customer>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPayment, setFilterPayment] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  const supabase = createClient()
  const itemsPerPage = 10
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const fetchOrders = useCallback(async () => {
    if (!user?.profile?.importer_id) return
    
    setLoading(true)
    try {
      // Build query
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('importer_id', user.profile.importer_id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      if (searchQuery) {
        query = query.ilike('order_number', `%${searchQuery}%`)
      }
      
      if (filterStatus) {
        query = query.eq('status', filterStatus)
      }
      
      if (filterPayment) {
        query = query.eq('payment_status', filterPayment)
      }

      const { data, error, count } = await query

      if (!error && data) {
        setOrders(data as Order[])
        setTotalCount(count || 0)

        // Fetch related customers
        const customerIds = [...new Set(data.map((o: { customer_id: string | null }) => o.customer_id).filter(Boolean))]

        if (customerIds.length > 0) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .in('id', customerIds)
          
          if (customerData) {
            const customerMap: Record<string, Customer> = {}
            customerData.forEach((c: Customer) => {
              customerMap[c.id] = c as Customer
            })
            setCustomers(customerMap)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.profile?.importer_id, supabase, currentPage, searchQuery, filterStatus, filterPayment])

  useEffect(() => {
    if (!authLoading && user?.profile?.importer_id) {
      fetchOrders()
    }
  }, [user, authLoading, fetchOrders])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (!error) {
        setOrders(orders.map(o => 
          o.id === orderId ? { ...o, status: newStatus } : o
        ))
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
    setShowStatusModal(null)
  }

  const handlePaymentStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (!error) {
        setOrders(orders.map(o => 
          o.id === orderId ? { ...o, payment_status: newStatus } : o
        ))
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  const handleViewOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
    }
  }

  const stats = {
    total: totalCount,
    pending: orders.filter((o: Order) => o.status === 'pending').length,
    processing: orders.filter((o: Order) => o.status === 'processing').length,
    delivered: orders.filter((o: Order) => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum: number, o: Order) => sum + (o.payment_status === 'paid' || o.payment_status === 'partial' ? o.total : 0), 0),
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
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">
            Manage and track your orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium rounded-lg transition touch-manipulation"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition touch-manipulation">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
        <div className="card p-3 md:p-4">
          <p className="text-lg md:text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Total Orders</p>
        </div>
        <div className="card p-3 md:p-4">
          <p className="text-lg md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="card p-3 md:p-4">
          <p className="text-lg md:text-2xl font-bold text-purple-600">{stats.processing}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Processing</p>
        </div>
        <div className="card p-3 md:p-4">
          <p className="text-lg md:text-2xl font-bold text-green-600">{stats.delivered}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Delivered</p>
        </div>
        <div className="card p-3 md:p-4 col-span-2 md:col-span-1">
          <p className="text-lg md:text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="input pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value)
            setCurrentPage(1)
          }}
          className="input w-full sm:w-auto min-w-[140px]"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterPayment}
          onChange={(e) => {
            setFilterPayment(e.target.value)
            setCurrentPage(1)
          }}
          className="input w-full sm:w-auto min-w-[140px]"
        >
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 md:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 md:p-8 text-center">
            <Package className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mx-auto" />
            <p className="mt-4 text-muted-foreground">
              {searchQuery || filterStatus || filterPayment 
                ? 'No orders match your filters.' 
                : 'No orders yet. Orders will appear here when customers place them.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  customer={order.customer_id ? customers[order.customer_id] : null}
                  onStatusChange={handleStatusChange}
                  onView={handleViewOrder}
                />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.pending
                    const paymentConfig = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending
                    const StatusIcon = config.icon
                    const customer = order.customer_id ? customers[order.customer_id] : null

                    return (
                      <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-4">
                          <Link href={`/orders/${order.id}`} className="font-medium text-foreground hover:text-primary">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {customer?.name || '-'}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-foreground">{formatCurrency(order.total)}</p>
                          {order.subtotal !== order.total && (
                            <p className="text-xs text-muted-foreground">
                              Subtotal: {formatCurrency(order.subtotal)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full touch-manipulation cursor-pointer ${config.bg} ${config.text}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={order.payment_status}
                            onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full touch-manipulation cursor-pointer ${paymentConfig.bg} ${paymentConfig.text}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/orders/${order.id}`} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg touch-manipulation">
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg touch-manipulation">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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

