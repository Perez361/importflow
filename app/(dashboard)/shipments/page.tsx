'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Shipment } from '@/types/database'
import { Truck, Plus } from 'lucide-react'

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user.auth) return
    
    async function loadShipments() {
      const result = await supabase.from('shipments').select('*').order('created_at', { ascending: false })
      if (result.data && Array.isArray(result.data)) {
        setShipments(result.data as Shipment[])
      }
    }
    
    loadShipments()
  }, [user.auth])

  if (!user.auth) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shipments</h1>
        <button className="btn btn-primary btn-sm">
          <Plus className="h-4 w-4" />
          Add Shipment
        </button>
      </div>
      <div className="card p-4">
        <p>Total Shipments: {shipments.length}</p>
      </div>
    </div>
  )
}
