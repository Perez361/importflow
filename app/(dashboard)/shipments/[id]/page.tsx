'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS } from '@/lib/constants'
import type { Shipment } from '@/types/database'
import {
  ArrowLeft,
  Loader2,
  Ship,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  Package,
  Truck,
  AlertCircle,
  FileText,
} from 'lucide-react'

export default function ShipmentDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const shipmentId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (shipmentId && user?.profile?.importer_id) {
      fetchShipment()
    }
  }, [shipmentId, user])

  const fetchShipment = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .eq('importer_id', user?.profile?.importer_id)
        .single()

      if (error) throw error
      setShipment(data)
    } catch (error) {
      console.error('Error fetching shipment:', error)
      setError('Shipment not found')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!shipment) return
    setUpdating(true)
    
    try {
      const updateData: Record<string, unknown> = { status: newStatus }
      
      // If delivered, set actual_arrival
      if (newStatus === SHIPMENT_STATUS.DELIVERED) {
        updateData.actual_arrival = new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id)

      if (error) throw error
      
      setShipment(prev => prev ? { 
        ...prev, 
        status: newStatus,
        actual_arrival: newStatus === SHIPMENT_STATUS.DELIVERED ? new Date().toISOString() : prev.actual_arrival
      } : null)
    } catch (error) {
      console.error('Error updating shipment status:', error)
      alert('Failed to update shipment status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case SHIPMENT_STATUS.PREPARING:
        return <Clock className="h-5 w-5" />
      case SHIPMENT_STATUS.IN_TRANSIT:
        return <Truck className="h-5 w-5" />
      case SHIPMENT_STATUS.CUSTOMS:
        return <Package className="h-5 w-5" />
      case SHIPMENT_STATUS.ARRIVED:
        return <CheckCircle className="h-5 w-5" />
      case SHIPMENT_STATUS.DELIVERED:
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Ship className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case SHIPMENT_STATUS.PREPARING:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case SHIPMENT_STATUS.IN_TRANSIT:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case SHIPMENT_STATUS.CUSTOMS:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
      case SHIPMENT_STATUS.ARRIVED:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
      case SHIPMENT_STATUS.DELIVERED:
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/20 dark:text-zinc-400'
    }
  }

  const calculateTotalCost = () => {
    if (!shipment) return 0
    return (shipment.shipping_cost || 0) + (shipment.customs_cost || 0) + (shipment.other_costs || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">{error || 'Shipment not found'}</p>
        <Link href="/shipments" className="mt-4 text-blue-600 hover:text-blue-500">
          Back to Shipments
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/shipments"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {shipment.shipment_number}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Created on {formatDateTime(shipment.created_at)}
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(shipment.status)}`}>
          {getStatusIcon(shipment.status)}
          {SHIPMENT_STATUS_LABELS[shipment.status as keyof typeof SHIPMENT_STATUS_LABELS] || shipment.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              Route
            </h2>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Origin</p>
                <p className="font-medium text-zinc-900 dark:text-white">{shipment.origin}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Destination</p>
                <p className="font-medium text-zinc-900 dark:text-white">{shipment.destination}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" />
              Timeline
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-blue-600"></div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">Shipment Created</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDateTime(shipment.created_at)}</p>
                </div>
              </div>
              
              {shipment.status !== SHIPMENT_STATUS.PREPARING && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-blue-600"></div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">In Transit</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDateTime(shipment.updated_at)}</p>
                  </div>
                </div>
              )}
              
              {shipment.actual_arrival && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-green-600"></div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Delivered</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDateTime(shipment.actual_arrival)}</p>
                  </div>
                </div>
              )}
              
              {shipment.estimated_arrival && !shipment.actual_arrival && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 mt-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Estimated Arrival</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(shipment.estimated_arrival)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {shipment.notes && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" />
                Notes
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {shipment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">
              Update Status
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(SHIPMENT_STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updateStatus(key)}
                  disabled={updating || shipment.status === key}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
                    shipment.status === key
                      ? getStatusColor(key)
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Costs */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5" />
              Costs
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Shipping</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {formatCurrency(shipment.shipping_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Customs</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {formatCurrency(shipment.customs_cost || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400">Other</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {formatCurrency(shipment.other_costs || 0)}
                </span>
              </div>
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-zinc-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(calculateTotalCost())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" />
              Dates
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Created</p>
                <p className="font-medium text-zinc-900 dark:text-white">{formatDate(shipment.created_at)}</p>
              </div>
              {shipment.estimated_arrival && (
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Estimated Arrival</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{formatDate(shipment.estimated_arrival)}</p>
                </div>
              )}
              {shipment.actual_arrival && (
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Actual Arrival</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{formatDate(shipment.actual_arrival)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}