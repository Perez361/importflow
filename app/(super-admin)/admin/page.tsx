'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Building2, Users, TrendingUp, Package, CreditCard, DollarSign } from 'lucide-react'
import type { Importer, Subscription } from '@/types/database'

interface Stats {
  totalImporters: number
  activeImporters: number
  inactiveImporters: number
  totalUsers: number
  totalProducts: number
  trialImporters: number
  paidImporters: number
  cancelledImporters: number
  monthlyRevenue: number
  yearlyRevenue: number
}

interface PlanStats {
  free: number
  starter: number
  pro: number
  enterprise: number
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalImporters: 0,
    activeImporters: 0,
    inactiveImporters: 0,
    totalUsers: 0,
    totalProducts: 0,
    trialImporters: 0,
    paidImporters: 0,
    cancelledImporters: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0
  })
  const [planStats, setPlanStats] = useState<PlanStats>({
    free: 0,
    starter: 0,
    pro: 0,
    enterprise: 0
  })
  const [recentImporters, setRecentImporters] = useState<Importer[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    async function loadStats() {
      // Load importers
      const importersRes = await supabase.from('importers').select('*')
      const importers = importersRes.data as Importer[] | null
      
      // Load subscriptions
      const subscriptionsRes = await supabase.from('subscriptions').select('*')
      const subscriptions = subscriptionsRes.data as Subscription[] | null
      
      // Load counts
      const [usersRes, productsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' })
      ])
      
      if (importers && subscriptions) {
        // Calculate subscription stats
        let trialCount = 0
        let paidCount = 0
        let cancelledCount = 0
        let monthlyRevenue = 0
        
        const newPlanStats: PlanStats = { free: 0, starter: 0, pro: 0, enterprise: 0 }
        
        subscriptions.forEach(sub => {
          // Count by plan
          if (sub.plan === 'free') newPlanStats.free++
          else if (sub.plan === 'starter') newPlanStats.starter++
          else if (sub.plan === 'pro') newPlanStats.pro++
          else if (sub.plan === 'enterprise') newPlanStats.enterprise++
          
          // Count by status
          if (sub.status === 'active') {
            if (sub.plan === 'free') {
              trialCount++
            } else {
              paidCount++
              monthlyRevenue += sub.price || 0
            }
          } else if (sub.status === 'cancelled') {
            cancelledCount++
          }
        })
        
        // Count importers without subscriptions as trial
        const importersWithSubs = new Set(subscriptions.map(s => s.importer_id))
        importers.forEach(imp => {
          if (!importersWithSubs.has(imp.id) && imp.subscription_status === 'trial') {
            trialCount++
            newPlanStats.free++
          }
        })
        
        setPlanStats(newPlanStats)
        setStats({
          totalImporters: importersRes.count || 0,
          activeImporters: importers.filter((i: Importer) => i.is_active).length,
          inactiveImporters: importers.filter((i: Importer) => !i.is_active).length,
          totalUsers: usersRes.count || 0,
          totalProducts: productsRes.count || 0,
          trialImporters: trialCount,
          paidImporters: paidCount,
          cancelledImporters: cancelledCount,
          monthlyRevenue,
          yearlyRevenue: monthlyRevenue * 12
        })
        
        // Get recent importers (last 5)
        setRecentImporters(importers.slice(0, 5))
      }
      setLoading(false)
    }

    if (user?.auth) {
      loadStats()
    }
  }, [user])

  if (!user?.auth) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="p-3 rounded-xl bg-blue-100 mb-4">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : stats.totalImporters}</p>
          <p className="text-sm text-muted-foreground">Total Importers</p>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-green-600">{stats.activeImporters} active</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-red-500">{stats.inactiveImporters} inactive</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="p-3 rounded-xl bg-green-100 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : stats.activeImporters}</p>
          <p className="text-sm text-muted-foreground">Active Importers</p>
          <div className="mt-2 text-xs text-green-600">
            {stats.totalImporters > 0 
              ? `${Math.round((stats.activeImporters / stats.totalImporters) * 100)}% active rate`
              : '0% active rate'}
          </div>
        </div>

        <div className="card p-6">
          <div className="p-3 rounded-xl bg-purple-100 mb-4">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>

        <div className="card p-6">
          <div className="p-3 rounded-xl bg-orange-100 mb-4">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : stats.totalProducts}</p>
          <p className="text-sm text-muted-foreground">Total Products</p>
        </div>
      </div>

      {/* Subscription Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Breakdown */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Subscription Breakdown</h3>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              {/* Plan Distribution */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Free/Trial</span>
                    <span className="font-bold">{planStats.free}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                    <div 
                      className="bg-gray-400 h-1.5 rounded-full" 
                      style={{ width: `${stats.totalImporters > 0 ? (planStats.free / stats.totalImporters) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Starter</span>
                    <span className="font-bold">{planStats.starter}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${stats.totalImporters > 0 ? (planStats.starter / stats.totalImporters) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Professional</span>
                    <span className="font-bold">{planStats.pro}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${stats.totalImporters > 0 ? (planStats.pro / stats.totalImporters) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Enterprise</span>
                    <span className="font-bold">{planStats.enterprise}</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                    <div 
                      className="bg-yellow-500 h-1.5 rounded-full" 
                      style={{ width: `${stats.totalImporters > 0 ? (planStats.enterprise / stats.totalImporters) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Subscription Status */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">{stats.paidImporters} Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">{stats.trialImporters} Trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">{stats.cancelledImporters} Cancelled</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Stats */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Revenue Overview</h3>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm text-green-700">Monthly Recurring Revenue</p>
                  <p className="text-2xl font-bold text-green-700">${stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Yearly Projected Revenue</p>
                  <p className="text-xl font-bold">${stats.yearlyRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              
              {/* Average Revenue Per User */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Average Revenue Per Paid Importer</p>
                <p className="text-lg font-semibold">
                  ${stats.paidImporters > 0 
                    ? (stats.monthlyRevenue / stats.paidImporters).toFixed(2)
                    : '0.00'
                  }/month
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Importers */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Recent Importers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Business</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Subscription</th>
                <th className="text-left p-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : recentImporters.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    No importers yet
                  </td>
                </tr>
              ) : (
                recentImporters.map((importer) => (
                  <tr key={importer.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{importer.business_name}</p>
                          <p className="text-sm text-muted-foreground">/{importer.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${importer.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {importer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        importer.subscription_status === 'active' ? 'badge-success' : 
                        importer.subscription_status === 'trial' ? 'badge-warning' : 
                        'badge-danger'
                      }`}>
                        {importer.subscription_status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(importer.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
