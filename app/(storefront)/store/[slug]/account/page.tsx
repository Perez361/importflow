'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'
import { Loader2, Package, User, LogOut, ArrowLeft, ShoppingBag, Save, Camera, Mail, Phone, MapPin, Check, X } from 'lucide-react'
import type { Importer } from '@/types/database'

interface StoreCustomer {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  avatar_url: string | null
  importer_id: string
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
}

export default function StoreAccountPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = useMemo(() => createClient(), [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [importer, setImporter] = useState<Importer | null>(null)
  const [customer, setCustomer] = useState<StoreCustomer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile')
  
  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  })

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    fetchData()
  }, [slug])

  const fetchData = async () => {
    try {
      // Get importer
      const { data: importerData } = await supabase
        .from('importers')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (!importerData) {
        router.push(`/store/${slug}`)
        return
      }

      setImporter(importerData as Importer)

      // Check if customer is logged in
      const customerSession = localStorage.getItem(`customer_${slug}`)
      
      if (!customerSession) {
        router.push(`/store/${slug}/login?redirect=/store/${slug}/account`)
        return
      }

      const customerData = JSON.parse(customerSession) as StoreCustomer
      setCustomer(customerData)
      
      // Initialize form data
      setFormData({
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        address: customerData.address || '',
        city: customerData.city || '',
      })

      // Fetch customer orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, total_amount, created_at')
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (ordersData) {
        setOrders(ordersData as Order[])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(`customer_${slug}`)
    router.push(`/store/${slug}`)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('store_customers')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
        })
        .eq('id', customer?.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        showNotification('error', 'Failed to update profile')
        setSaving(false)
        return
      }

      // Update localStorage with new data
      const updatedCustomer = {
        ...customer,
        ...data,
      }
      localStorage.setItem(`customer_${slug}`, JSON.stringify(updatedCustomer))
      setCustomer(updatedCustomer as StoreCustomer)
      setIsEditing(false)
      showNotification('success', 'Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification('error', 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !customer) return

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileName = `avatars/${customer.id}/${Date.now()}_${file.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        showNotification('error', 'Failed to upload avatar')
        setUploading(false)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      // Update customer record
      const { data, error } = await supabase
        .from('store_customers')
        .update({ avatar_url: publicUrl })
        .eq('id', customer.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating avatar:', error)
        showNotification('error', 'Failed to save avatar')
        setUploading(false)
        return
      }

      // Update localStorage
      const updatedCustomer = {
        ...customer,
        avatar_url: publicUrl,
      }
      localStorage.setItem(`customer_${slug}`, JSON.stringify(updatedCustomer))
      setCustomer(updatedCustomer as StoreCustomer)
      showNotification('success', 'Profile picture updated!')
      
      // Dispatch custom event to notify layout of avatar change
      window.dispatchEvent(new Event('customer-avatar-updated'))
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showNotification('error', 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-in ${
          notification.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      {/* Back link */}
      <Link
        href={`/store/${slug}`}
        className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Store
      </Link>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-700 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-1 font-medium transition-colors relative ${
            activeTab === 'profile'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Profile
          </span>
          {activeTab === 'profile' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-1 font-medium transition-colors relative ${
            activeTab === 'orders'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </span>
          {activeTab === 'orders' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && customer && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden mx-auto">
                  {customer.avatar_url ? (
                    <img 
                      src={customer.avatar_url} 
                      alt={customer.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-zinc-400" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                {customer.name}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{customer.email}</p>
              <button
                onClick={handleLogout}
                className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Profile Details
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form data
                        setFormData({
                          name: customer?.name || '',
                          email: customer?.email || '',
                          phone: customer?.phone || '',
                          address: customer?.address || '',
                          city: customer?.city || '',
                        })
                      }}
                      className="text-sm text-zinc-500 hover:text-zinc-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Main Street"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="New York"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-500 dark:text-zinc-400">Email:</span>
                    <span className="text-zinc-900 dark:text-white">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-500 dark:text-zinc-400">Phone:</span>
                    <span className="text-zinc-900 dark:text-white">{customer.phone || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-500 dark:text-zinc-400">Address:</span>
                    <span className="text-zinc-900 dark:text-white">
                      {customer.address ? `${customer.address}${customer.city ? `, ${customer.city}` : ''}` : 'Not set'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400">No orders yet</p>
              <Link
                href={`/store/${slug}`}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/store/${slug}/orders/${order.id}`}
                  className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        Order #{order.order_number}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
