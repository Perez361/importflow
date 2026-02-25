'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency } from '@/lib/utils/format'
import { SHIPMENT_STATUS, COMMON_IMPORT_ORIGINS } from '@/lib/constants'
import {
  ArrowLeft,
  Loader2,
  Ship,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react'

export default function NewShipmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    shipment_number: '',
    origin: '',
    destination: '',
    shipping_cost: '',
    customs_cost: '',
    other_costs: '',
    estimated_arrival: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateShipmentNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `SHP-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const shipmentNumber = formData.shipment_number || generateShipmentNumber()
      
      const { error: insertError } = await supabase
        .from('shipments')
        .insert({
          importer_id: user?.profile?.importer_id,
          shipment_number: shipmentNumber,
          origin: formData.origin,
          destination: formData.destination,
          status: SHIPMENT_STATUS.PREPARING,
          shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : null,
          customs_cost: formData.customs_cost ? parseFloat(formData.customs_cost) : null,
          other_costs: formData.other_costs ? parseFloat(formData.other_costs) : null,
          estimated_arrival: formData.estimated_arrival || null,
          notes: formData.notes || null,
        })

      if (insertError) throw insertError

      router.push('/shipments')
    } catch (error) {
      console.error('Error creating shipment:', error)
      setError('Failed to create shipment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const totalCost = (parseFloat(formData.shipping_cost) || 0) + 
                    (parseFloat(formData.customs_cost) || 0) + 
                    (parseFloat(formData.other_costs) || 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/shipments"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            New Shipment
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Create a new import shipment
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Shipment Details
          </h2>
          
          <div className="space-y-2">
            <label htmlFor="shipment_number" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Shipment Number
            </label>
            <div className="flex gap-2">
              <input
                id="shipment_number"
                name="shipment_number"
                type="text"
                value={formData.shipment_number}
                onChange={handleChange}
                placeholder="Auto-generated if empty"
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, shipment_number: generateShipmentNumber() }))}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="origin" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Origin *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  id="origin"
                  name="origin"
                  type="text"
                  value={formData.origin}
                  onChange={handleChange}
                  required
                  list="origins"
                  placeholder="e.g., China, Dubai"
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="origins">
                  {COMMON_IMPORT_ORIGINS.map(origin => (
                    <option key={origin} value={origin} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Destination *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  id="destination"
                  name="destination"
                  type="text"
                  value={formData.destination}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Accra, Ghana"
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="estimated_arrival" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Estimated Arrival Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                id="estimated_arrival"
                name="estimated_arrival"
                type="date"
                value={formData.estimated_arrival}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Costs */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Costs
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="shipping_cost" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Shipping Cost (₵)
              </label>
              <input
                id="shipping_cost"
                name="shipping_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.shipping_cost}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customs_cost" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Customs Cost (₵)
              </label>
              <input
                id="customs_cost"
                name="customs_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.customs_cost}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="other_costs" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Other Costs (₵)
              </label>
              <input
                id="other_costs"
                name="other_costs"
                type="number"
                step="0.01"
                min="0"
                value={formData.other_costs}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {totalCost > 0 && (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Total Cost</span>
                <span className="text-xl font-bold text-zinc-900 dark:text-white">
                  {formatCurrency(totalCost)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Additional Notes
          </h2>
          
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Add any notes about this shipment..."
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/shipments"
            className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Creating...' : 'Create Shipment'}
          </button>
        </div>
      </form>
    </div>
  )
}