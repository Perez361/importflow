'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Product, Order, OrderItem, Customer } from '@/types/database'
import {
  Search,
  Package,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter,
  DollarSign,
  ShoppingCart,
} from 'lucide-react'

interface ProductWithBuyers extends Product {
  buyers: {
    order: Order
    orderItem: OrderItem
    customer: Customer
  }[]
}

export default function BuyerTrackingPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!user?.profile?.importer_id) return
    
    setLoading(true)
    try {
      // Fetch all products
      const productsResult = await supabase
        .from('products')
        .select('*')
        .eq('importer_id', user.profile.importer_id)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      // Fetch all orders for this importer
      const ordersResult = await supabase
        .from('orders')
        .select('*')
        .eq('importer_id', user.profile.importer_id)
        .order('created_at', { ascending: false })

      // Fetch all order items
      const orderIds = ordersResult.data?.map((o: Order) => o.id) || []
      let orderItemsResult = { data: [] as OrderItem[], error: null }
      if (orderIds.length > 0) {
        orderItemsResult = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds)
      }

      // Fetch all customers
      const customersResult = await supabase
        .from('customers')
        .select('*')
        .eq('importer_id', user.profile.importer_id)

      if (!productsResult.error) setProducts(productsResult.data || [])
      if (!ordersResult.error) setOrders(ordersResult.data || [])
      if (!orderItemsResult.error) setOrderItems(orderItemsResult.data || [])
      if (!customersResult.error) setCustomers(customersResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.profile?.importer_id, supabase])

  useEffect(() => {
    if (!authLoading && user?.profile?.importer_id) {
      fetchData()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading, fetchData])

  // Build products with their buyers
  const productsWithBuyers: ProductWithBuyers[] = products.map(product => {
    const productOrderItems = orderItems.filter(oi => oi.product_id === product.id)
    const buyers = productOrderItems.map(oi => {
      const order = orders.find(o => o.id === oi.order_id)
      const customer = order?.customer_id 
        ? customers.find(c => c.id === order.customer_id)
        : null
      return {
        order: order!,
        orderItem: oi,
        customer: customer || { 
          id: '', 
          importer_id: '', 
          name: 'Guest Customer', 
          email: null, 
          phone: null, 
          address: null, 
          city: null, 
          total_orders: 0, 
          total_spent: 0, 
          notes: null, 
          created_at: '', 
          updated_at: '' 
        }
      }
    }).filter(b => b.order)

    return {
      ...product,
      buyers
    }
  })

  // Filter by search and category
  const filteredProducts = productsWithBuyers.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.buyers.some(b => 
                           b.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
                         )
    const matchesCategory = !filterCategory || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Group by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = product.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(product)
    return acc
  }, {} as Record<string, ProductWithBuyers[]>)

  const categories = [...new Set(products.map(p => p.category).filter((c): c is string => Boolean(c)))]

  const toggleProduct = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const updatePaymentStatus = async (orderItemId: string, status: 'paid' | 'unpaid') => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ 
          payment_status: status,
          paid_amount: status === 'paid' ? orderItems.find(oi => oi.id === orderItemId)?.total_price || 0 : 0
        })
        .eq('id', orderItemId)

      if (!error) {
        setOrderItems(prev => prev.map(oi => 
          oi.id === orderItemId 
            ? { ...oi, payment_status: status, paid_amount: status === 'paid' ? oi.total_price : 0 }
            : oi
        ))
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  // Helper function to get payment status with default
  const getPaymentStatus = (orderItem: OrderItem): string => {
    return (orderItem as any).payment_status || 'unpaid'
  }

  // Calculate stats
  const totalPreorders = productsWithBuyers.reduce((sum, p) => sum + p.buyers.length, 0)
  const totalPaid = productsWithBuyers.reduce((sum, p) => 
    sum + p.buyers.filter(b => getPaymentStatus(b.orderItem) === 'paid').length, 0
  )
  const totalUnpaid = totalPreorders - totalPaid
  const totalRevenue = productsWithBuyers.reduce((sum, p) => 
    sum + p.buyers.filter(b => getPaymentStatus(b.orderItem) === 'paid').reduce((s, b) => s + Number(b.orderItem.total_price), 0)
  , 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Buyer Tracking</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">
            Track pre-orders by product and manage payments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{totalPreorders}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Total Pre-orders</p>
            </div>
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{totalPaid}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Paid</p>
            </div>
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{totalUnpaid}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Unpaid</p>
            </div>
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products or buyers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input w-full sm:w-auto min-w-[140px]"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products by Category */}
      {Object.keys(groupedProducts).length === 0 ? (
        <div className="card p-6 md:p-8 text-center">
          <Package className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mx-auto" />
          <p className="mt-4 text-muted-foreground">
            {products.length === 0 
              ? 'No products yet. Add products to start tracking pre-orders!' 
              : 'No pre-orders yet. Customers will appear here when they order.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category} className="card overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {category}
                  <span className="text-sm text-muted-foreground font-normal">
                    ({categoryProducts.length} products, {categoryProducts.reduce((s, p) => s + p.buyers.length, 0)} orders)
                  </span>
                </h2>
              </div>
              <div className="divide-y divide-border">
                {categoryProducts.map((product) => (
                  <div key={product.id}>
                    {/* Product Header */}
                    <button
                      onClick={() => toggleProduct(product.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {expandedProducts.has(product.id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(product.selling_price)} • {product.buyers.length} pre-order(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.buyers.length > 0 && (
                          <>
                            <span className="text-sm text-green-600 dark:text-green-400">
                              {product.buyers.filter(b => getPaymentStatus(b.orderItem) === 'paid').length} paid
                            </span>
                            <span className="text-sm text-red-600 dark:text-red-400">
                              {product.buyers.filter(b => getPaymentStatus(b.orderItem) !== 'paid').length} unpaid
                            </span>
                          </>
                        )}
                      </div>
                    </button>

                    {/* Buyers List */}
                    {expandedProducts.has(product.id) && product.buyers.length > 0 && (
                      <div className="bg-muted/20 px-4 py-3 border-t border-border">
                        <div className="space-y-2">
                          {product.buyers.map((buyer, index) => (
                            <div 
                              key={`${buyer.order.id}-${buyer.orderItem.id}-${index}`}
                              className="flex items-center justify-between py-2 px-3 bg-card rounded-lg border border-border"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{buyer.customer.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {buyer.customer.phone || buyer.customer.email || 'No contact'}
                                    {' • '}
                                    {formatDate(buyer.order.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-medium text-foreground text-sm">
                                    {formatCurrency(buyer.orderItem.total_price)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {buyer.orderItem.quantity}
                                  </p>
                                </div>
                                <button
                                  onClick={() => updatePaymentStatus(
                                    buyer.orderItem.id, 
                                    getPaymentStatus(buyer.orderItem) === 'paid' ? 'unpaid' : 'paid'
                                  )}
                                  className={`p-2 rounded-lg transition-colors ${
                                    getPaymentStatus(buyer.orderItem) === 'paid'
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                                      : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                                  }`}
                                  title={getPaymentStatus(buyer.orderItem) === 'paid' ? 'Mark as unpaid' : 'Mark as paid'}
                                >
                                  {getPaymentStatus(buyer.orderItem) === 'paid' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No buyers message */}
                    {expandedProducts.has(product.id) && product.buyers.length === 0 && (
                      <div className="bg-muted/20 px-4 py-4 border-t border-border text-center text-muted-foreground text-sm">
                        No pre-orders for this product yet
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
