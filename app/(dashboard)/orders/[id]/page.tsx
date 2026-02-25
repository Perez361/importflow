'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants'
import type { Order, OrderItem, Customer, Product } from '@/types/database'
import {
  ArrowLeft,
  Loader2,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  MessageSquare,
} from 'lucide-react'

type OrderItemWithProduct = OrderItem & {
  product: Product | null
}

type OrderDetails = Order & {
  order_items: OrderItemWithProduct[]
  customer: Customer | null
}

export default function OrderDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    if (orderId && user?.profile?.importer_id) {
      fetchOrder()
    }
  }, [orderId, user])

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          ),
          customer:customers (*)
        `)
        .eq('id', orderId)
        .eq('importer_id', user?.profile?.importer_id)
        .single()

      if (error) throw error
      setOrder(data as OrderDetails)
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Order not found')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return
    setUpdating(true)
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id)

      if (error) throw error
      
      setOrder(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const updatePaymentStatus = async (newStatus: string) => {
    if (!order) return
    setUpdating(true)
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', order.id)

      if (error) throw error
      
      setOrder(prev => prev ? { ...prev, payment_status: newStatus } : null)
    } catch (error) {
      console.error('Error updating payment status:', error)
      alert('Failed to update payment status')
    } finally {
      setUpdating(false)
    }
  }

  const addNote = async () => {
    if (!order || !newNote.trim()) return
    setUpdating(true)
    
    try {
      const notes = order.notes ? `${order.notes}\n\n${new Date().toISOString()}: ${newNote}` : newNote
      const { error } = await supabase
        .from('orders')
        .update({ notes })
        .eq('id', order.id)

      if (error) throw error
      
      setOrder(prev => prev ? { ...prev, notes } : null)
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case ORDER_STATUS.CONFIRMED:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case ORDER_STATUS.PROCESSING:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
      case ORDER_STATUS.SHIPPED:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
      case ORDER_STATUS.DELIVERED:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/20 dark:text-zinc-400'
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case PAYMENT_STATUS.PAID:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case PAYMENT_STATUS.PARTIAL:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case PAYMENT_STATUS.UNPAID:
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">{error || 'Order not found'}</p>
        <Link href="/orders" className="mt-4 text-blue-600 hover:text-blue-500">
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/orders"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Order {order.order_number}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Placed on {formatDateTime(order.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {order.order_items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white truncate">
                      {item.product?.name || 'Unknown Product'}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="text-zinc-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-900 dark:text-white">Total</span>
                <span className="text-zinc-900 dark:text-white">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5" />
              Notes
            </h2>
            {order.notes && (
              <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {order.notes}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim() || updating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Updates */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">
              Update Status
            </h2>
            
            {/* Order Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Order Status
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => updateOrderStatus(key)}
                    disabled={updating || order.status === key}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                      order.status === key
                        ? getStatusColor(key)
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Payment Status
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => updatePaymentStatus(key)}
                    disabled={updating || order.payment_status === key}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                      order.payment_status === key
                        ? getPaymentColor(key)
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              Customer
            </h2>
            
            {order.customer ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {order.customer.name}
                  </p>
                  {order.customer.email && (
                    <a href={`mailto:${order.customer.email}`} className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-600">
                      <Mail className="h-4 w-4" />
                      {order.customer.email}
                    </a>
                  )}
                  {order.customer.phone && (
                    <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-600">
                      <Phone className="h-4 w-4" />
                      {order.customer.phone}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Guest checkout
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" />
              Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-600"></div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Order Placed</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(order.created_at)}</p>
                </div>
              </div>
              {order.status !== ORDER_STATUS.PENDING && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-600"></div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(order.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}