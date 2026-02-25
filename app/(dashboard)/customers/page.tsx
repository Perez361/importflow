'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Customer } from '@/types/database'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user.auth) return
    
    async function loadCustomers() {
      const result = await supabase.from('customers').select('*')
      if (result.data && Array.isArray(result.data)) {
        setCustomers(result.data as Customer[])
      }
    }
    
    loadCustomers()
  }, [user.auth])

  if (!user.auth) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button className="btn btn-primary btn-sm">
          Add Customer
        </button>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search customers..." className="input mb-4" />
        <p>Customers count: {customers.length}</p>
      </div>
    </div>
  )
}
