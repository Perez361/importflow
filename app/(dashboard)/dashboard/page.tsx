'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency } from '@/lib/utils/format'
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

// Stats card component
function StatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  gradient,
}: {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative'
  icon: React.ElementType
  gradient: string
}) {
  return (
    <div className="card-hover p-6 group">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
              changeType === 'positive'
                ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
                : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
            }`}
          >
            {changeType === 'positive' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {title}
        </p>
      </div>
    </div>
  )
}

// Recent order row
function RecentOrderRow({
  orderNumber,
  customer,
  amount,
  status,
  date,
}: {
  orderNumber: string
  customer: string
  amount: string
  status: string
  date: string
}) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' },
    confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
    processing: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400' },
    shipped: { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400' },
    delivered: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
    cancelled: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
      <td className="py-4 px-6">
        <span className="font-medium text-foreground whitespace-nowrap">
          {orderNumber}
        </span>
      </td>
      <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">{customer}</td>
      <td className="py-4 px-6 text-foreground font-medium whitespace-nowrap">
        {amount}
      </td>
      <td className="py-4 px-6 whitespace-nowrap">
        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
          {status}
        </span>
      </td>
      <td className="py-4 px-6 text-muted-foreground text-sm whitespace-nowrap">
        {date}
      </td>
      <td className="py-4 px-6 text-right">
        <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

// Low stock alert row
function LowStockRow({
  name,
  sku,
  quantity,
  threshold,
}: {
  name: string
  sku: string
  quantity: number
  threshold: number
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 group hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{sku}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-destructive">{quantity} left</p>
        <p className="text-xs text-muted-foreground">
          Threshold: {threshold}
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  // Mock data - in production, this would come from the database
  const stats = {
    totalRevenue: 125000,
    revenueChange: '+12.5%',
    totalOrders: 156,
    ordersChange: '+8.2%',
    totalProducts: 89,
    productsChange: '+3',
    totalCustomers: 234,
    customersChange: '+15.3%',
  }

  const recentOrders = [
    {
      orderNumber: 'ORD-001',
      customer: 'John Doe',
      amount: formatCurrency(1250),
      status: 'delivered',
      date: '2 hours ago',
    },
    {
      orderNumber: 'ORD-002',
      customer: 'Jane Smith',
      amount: formatCurrency(890),
      status: 'processing',
      date: '5 hours ago',
    },
    {
      orderNumber: 'ORD-003',
      customer: 'Bob Johnson',
      amount: formatCurrency(2100),
      status: 'pending',
      date: '1 day ago',
    },
    {
      orderNumber: 'ORD-004',
      customer: 'Alice Brown',
      amount: formatCurrency(450),
      status: 'shipped',
      date: '1 day ago',
    },
  ]

  const lowStockProducts = [
    { name: 'Product A', sku: 'SKU-001', quantity: 3, threshold: 5 },
    { name: 'Product B', sku: 'SKU-002', quantity: 2, threshold: 10 },
    { name: 'Product C', sku: 'SKU-003', quantity: 5, threshold: 10 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user.profile?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <Link
          href="/products/new"
          className="btn btn-primary btn-sm w-fit"
        >
          <Sparkles className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          changeType="positive"
          icon={DollarSign}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          change={stats.ordersChange}
          changeType="positive"
          icon={ShoppingCart}
          gradient="from-purple-500 to-pink-500"
        />
        <StatsCard
          title="Products"
          value={stats.totalProducts.toString()}
          change={stats.productsChange}
          changeType="positive"
          icon={Package}
          gradient="from-orange-500 to-red-500"
        />
        <StatsCard
          title="Customers"
          value={stats.totalCustomers.toString()}
          change={stats.customersChange}
          changeType="positive"
          icon={Users}
          gradient="from-green-500 to-emerald-500"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Orders
            </h2>
            <Link
              href="/orders"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 -mx-6">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3 px-6 font-medium">Order</th>
                  <th className="pb-3 px-6 font-medium">Customer</th>
                  <th className="pb-3 px-6 font-medium">Amount</th>
                  <th className="pb-3 px-6 font-medium">Status</th>
                  <th className="pb-3 px-6 font-medium">Date</th>
                  <th className="pb-3 px-6 font-medium text-right sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <RecentOrderRow key={order.orderNumber} {...order} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Low Stock
              </h2>
            </div>
            <Link
              href="/products?filter=low-stock"
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="mt-4">
            {lowStockProducts.map((product) => (
              <LowStockRow key={product.sku} {...product} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-cyan-600 p-8 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Ready to grow your business?</h2>
            <p className="text-white/80 mt-2 max-w-lg">
              Add new products, manage orders, and track your shipments all in one place. Your success starts here.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products/new"
              className="btn bg-white text-primary hover:bg-white/90 font-medium"
            >
              <Package className="h-4 w-4" />
              Add Product
            </Link>
            <Link
              href="/orders"
              className="btn bg-white/20 text-white hover:bg-white/30 border border-white/30"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
