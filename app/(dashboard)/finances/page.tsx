'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { DollarSign, TrendingUp, TrendingDown, Package, ShoppingCart } from 'lucide-react'

interface FinanceStats {
  totalRevenue: number
  totalCosts: number
  totalOrders: number
  totalProducts: number
}

export default function FinancesPage() {
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    totalCosts: 0,
    totalOrders: 0,
    totalProducts: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    async function loadStats() {
      const [ordersRes, productsRes, shipmentsRes] = await Promise.all([
        supabase.from('orders').select('total, subtotal'),
        supabase.from('products').select('cost_price, quantity'),
        supabase.from('shipments').select('shipping_cost, customs_cost, other_costs')
      ])

      const orders = ordersRes.data || []
      const products = productsRes.data || []
      const shipments = shipmentsRes.data || []

      const totalRevenue = orders.reduce((sum: number, o: { total: number | null }) => sum + (o.total || 0), 0)
      const totalCosts = products.reduce((sum: number, p: { cost_price: number | null; quantity: number }) => 
        sum + ((p.cost_price || 0) * p.quantity), 0)
      const shipmentCosts = shipments.reduce((sum: number, s: { shipping_cost: number | null; customs_cost: number | null; other_costs: number | null }) => 
        sum + (s.shipping_cost || 0) + (s.customs_cost || 0) + (s.other_costs || 0), 0)

      setStats({
        totalRevenue,
        totalCosts: totalCosts + shipmentCosts,
        totalOrders: orders.length,
        totalProducts: products.length
      })
      setLoading(false)
    }

    if (user?.auth) {
      loadStats()
    }
  }, [user])

  const profit = stats.totalRevenue - stats.totalCosts
  const margin = stats.totalRevenue > 0 ? ((profit / stats.totalRevenue) * 100) : 0

  if (!user?.auth) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finances</h1>
        <p className="text-muted-foreground">Financial overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="p-3 rounded-xl bg-green-100 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : `$${stats.totalRevenue.toFixed(2)}`}</p>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
        </div>

        <div className="card p-6">
          <div className="p-3 rounded-xl bg-red-100 mb-4">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : `$${stats.totalCosts.toFixed(2)}`}</p>
          <p className="text-sm text-muted-foreground">Total Costs</p>
        </div>

        <div className="card p-6">
          <div className={`p-3 rounded-xl mb-4 ${profit >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
            {profit >= 0 ? (
              <TrendingUp className="h-5 w-5 text-blue-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : `$${profit.toFixed(2)}`}</p>
          <p className="text-sm text-muted-foreground">Net Profit</p>
        </div>

        <div className="card p-6">
          <div className="p-3 rounded-xl bg-purple-100 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : `${margin.toFixed(1)}%`}</p>
          <p className="text-sm text-muted-foreground">Profit Margin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Orders</h3>
          </div>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
          <p className="text-sm text-muted-foreground">Total orders</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Products</h3>
          </div>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
          <p className="text-sm text-muted-foreground">Total products</p>
        </div>
      </div>
    </div>
  )
}
