'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, ORDER_STATUS, PAYMENT_STATUS } from '@/lib/constants'
import type { Customer, Order, OrderItem } from '@/types/database'
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calendar,
  Clock,
  Eye,
} from 'lucide-react'

type OrderWithItems = Order & {
  order_items: OrderItem[]
}

export default function CustomerDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (customerId && user?.profile?.importer_id) {
      fetchCustomer()
    }
  }, [customerId, user])

  const fetchCustomer = async () => {
    try {
      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('importer_id', user?.profile?.importer_id)
        .single()

      if (customerError) throw customerError
      setCustomer(customerData)

      // Fetch customer orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('customer_id', customerId)
        .eq('importer_id', user?.profile?.importer_id)
        .order('created_at', { ascending: false })

      if (!ordersError && ordersData) {
        setOrders(ordersData as OrderWithItems[])
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      setError('Customer not found')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case ORDER_STATUS.DELIVERED:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case ORDER_STATUS.CANCELLED:
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  const getPaymentColor = (status: string) => {
    switch (status) {
      case PAYMENT_STATUS.PAID:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case PAYMENT_STATUS.PARTIAL:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
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

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">{error || 'Customer not found'}</p>
        <Link href="/customers" className="mt-4 text-blue-600 hover:text-blue-500">
          Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/customers"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {customer.name}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Customer since {formatDate(customer.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              Contact Information
            </h2>
            
            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                  </span>
                </div>
              )}
              {!customer.email && !customer.phone && !customer.address && (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">No contact information</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5" />
              Summary
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Total Orders</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{customer.total_orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Total Spent</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(customer.total_spent)}</span>
              </div>
              {customer.total_orders > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400">Avg. Order Value</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {formatCurrency(customer.total_spent / customer.total_orders)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="font-semibold text-zinc-900 dark:text-white mb-3">
                Notes
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {customer.notes}
              </p>
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order History
              </h2>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto" />
                <p className="mt-4 text-zinc-500 dark:text-zinc-400">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium text-zinc-900 dark:text-white hover:text-blue-600"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentColor(order.payment_status)}`}>
                        {PAYMENT_STATUS_LABELS[order.payment_status as keyof typeof PAYMENT_STATUS_LABELS] || order.payment_status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {order.order_items.length} item(s)
                      </p>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}