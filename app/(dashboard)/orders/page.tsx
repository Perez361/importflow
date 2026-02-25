'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Order } from '@/types/database'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user.auth) return
    
    async function loadOrders() {
      const result = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (result.data && Array.isArray(result.data)) {
        setOrders(result.data as Order[])
      }
    }
    
    loadOrders()
  }, [user.auth])

  if (!user.auth) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>
      <div className="card p-4">
        <p>Total Orders: {orders.length}</p>
      </div>
    </div>
  )
}
