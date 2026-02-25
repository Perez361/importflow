'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import type { Importer, Subscription, User } from '@/types/database'
import { 
  Building2, Search, MoreVertical, Plus, X, Edit2, Eye, 
  ToggleLeft, ToggleRight, CreditCard, Calendar, Users,
  Check, AlertCircle, Loader2, Trash2
} from 'lucide-react'

// Extended types for joined data
interface ImporterWithSubscription extends Importer {
  subscription?: Subscription | null
  users?: User[]
  users_count?: number
}

// Plan pricing
const PLANS = [
  { id: 'free', name: 'Free Trial', price: 0 },
  { id: 'starter', name: 'Starter', price: 29 },
  { id: 'pro', name: 'Professional', price: 79 },
  { id: 'enterprise', name: 'Enterprise', price: 199 },
]

type ModalType = 'view' | 'edit' | 'add' | 'subscription' | null

export default function ImportersPage() {
  const [importers, setImporters] = useState<ImporterWithSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all')
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedImporter, setSelectedImporter] = useState<ImporterWithSubscription | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Ghana',
    currency: 'GHS',
  })
  
  // Subscription form state
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: 'free',
    status: 'active',
  })
  
  const supabase = createClient()
  const { user } = useAuth()

  // Load importers with subscription data
  useEffect(() => {
    async function loadImporters() {
      const result = await supabase
        .from('importers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (result.data) {
        // Fetch subscription and user count for each importer
        const importersWithData = await Promise.all(
          (result.data as Importer[]).map(async (importer) => {
            const [subResult, usersResult] = await Promise.all([
              supabase
                .from('subscriptions')
                .select('*')
                .eq('importer_id', importer.id)
                .single(),
              supabase
                .from('users')
                .select('id', { count: 'exact' })
                .eq('importer_id', importer.id)
            ])
            
            return {
              ...importer,
              subscription: subResult.data as Subscription | null,
              users_count: usersResult.count || 0,
            } as ImporterWithSubscription
          })
        )
        setImporters(importersWithData)
      }
      setLoading(false)
    }

    if (user?.auth) {
      loadImporters()
    }
  }, [user])

  // Load full importer details for modal
  async function loadImporterDetails(importerId: string) {
    setModalLoading(true)
    const [importerResult, subscriptionResult, usersResult] = await Promise.all([
      supabase.from('importers').select('*').eq('id', importerId).single(),
      supabase.from('subscriptions').select('*').eq('importer_id', importerId).single(),
      supabase.from('users').select('*').eq('importer_id', importerId)
    ])
    
    setSelectedImporter({
      ...(importerResult.data as Importer),
      subscription: subscriptionResult.data as Subscription | null,
      users: usersResult.data as User[] | [],
      users_count: usersResult.data?.length || 0,
    })
    setModalLoading(false)
  }

  // Filter importers
  const filteredImporters = importers.filter(i => {
    const matchesSearch = 
      i.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.slug.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'active' 
        ? i.is_active 
        : !i.is_active
    
    const matchesSubscription = subscriptionFilter === 'all'
      ? true
      : i.subscription_status === subscriptionFilter
    
    return matchesSearch && matchesStatus && matchesSubscription
  })

  // Handle toggle active status
  async function toggleActiveStatus(importer: ImporterWithSubscription) {
    const newStatus = !importer.is_active
    await supabase
      .from('importers')
      .update({ is_active: newStatus })
      .eq('id', importer.id)
    
    setImporters(prev => 
      prev.map(i => i.id === importer.id ? { ...i, is_active: newStatus } : i)
    )
  }

  // Handle add new importer
  async function handleAddImporter() {
    // Generate slug from business name
    const slug = formData.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Check if slug exists
    const { data: existing } = await supabase
      .from('importers')
      .select('slug')
      .eq('slug', slug)
      .single()
    
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug
    
    // Create importer
    const { data: newImporter, error } = await supabase
      .from('importers')
      .insert({
        business_name: formData.business_name,
        email: formData.email,
        slug: finalSlug,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country,
        currency: formData.currency,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    
    if (newImporter) {
      // Create subscription record
      await supabase.from('subscriptions').insert({
        importer_id: newImporter.id,
        plan: 'free',
        status: 'active',
        price: 0,
        billing_cycle: 'monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      
      // Refresh list
      const result = await supabase
        .from('importers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (result.data) {
        setImporters(result.data as Importer[])
      }
    }
    
    setModalType(null)
    setFormData({ business_name: '', email: '', phone: '', address: '', city: '', country: 'Ghana', currency: 'GHS' })
  }

  // Handle update importer
  async function handleUpdateImporter() {
    if (!selectedImporter) return
    
    await supabase
      .from('importers')
      .update({
        business_name: formData.business_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country,
        currency: formData.currency,
      })
      .eq('id', selectedImporter.id)
    
    // Refresh list
    const result = await supabase
      .from('importers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (result.data) {
      const importersWithData = await Promise.all(
        (result.data as Importer[]).map(async (importer) => {
          const [subResult, usersResult] = await Promise.all([
            supabase.from('subscriptions').select('*').eq('importer_id', importer.id).single(),
            supabase.from('users').select('id', { count: 'exact' }).eq('importer_id', importer.id)
          ])
          return {
            ...importer,
            subscription: subResult.data as Subscription | null,
            users_count: usersResult.count || 0,
          } as ImporterWithSubscription
        })
      )
      setImporters(importersWithData)
    }
    
    setModalType(null)
    setSelectedImporter(null)
  }

  // Handle subscription update
  async function handleUpdateSubscription() {
    if (!selectedImporter) return
    
    const plan = PLANS.find(p => p.id === subscriptionForm.plan)
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    // Update or create subscription
    if (selectedImporter.subscription) {
      await supabase
        .from('subscriptions')
        .update({
          plan: subscriptionForm.plan,
          status: subscriptionForm.status,
          price: plan?.price || 0,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .eq('id', selectedImporter.subscription.id)
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          importer_id: selectedImporter.id,
          plan: subscriptionForm.plan,
          status: subscriptionForm.status,
          price: plan?.price || 0,
          billing_cycle: 'monthly',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
    }
    
    // Update importer subscription_status
    await supabase
      .from('importers')
      .update({ 
        subscription_status: subscriptionForm.plan === 'free' ? 'trial' : subscriptionForm.status === 'active' ? 'active' : 'cancelled'
      })
      .eq('id', selectedImporter.id)
    
    // Refresh
    await loadImporterDetails(selectedImporter.id)
    const result = await supabase.from('importers').select('*').order('created_at', { ascending: false })
    if (result.data) {
      const importersWithData = await Promise.all(
        (result.data as Importer[]).map(async (importer) => {
          const [subResult, usersResult] = await Promise.all([
            supabase.from('subscriptions').select('*').eq('importer_id', importer.id).single(),
            supabase.from('users').select('id', { count: 'exact' }).eq('importer_id', importer.id)
          ])
          return {
            ...importer,
            subscription: subResult.data as Subscription | null,
            users_count: usersResult.count || 0,
          } as ImporterWithSubscription
        })
      )
      setImporters(importersWithData)
    }
    
    setModalType(null)
  }

  // Open modals
  function openViewModal(importer: ImporterWithSubscription) {
    loadImporterDetails(importer.id)
    setSelectedImporter(importer)
    setModalType('view')
  }

  function openEditModal(importer: ImporterWithSubscription) {
    setSelectedImporter(importer)
    setFormData({
      business_name: importer.business_name,
      email: importer.email,
      phone: importer.phone || '',
      address: importer.address || '',
      city: importer.city || '',
      country: importer.country,
      currency: importer.currency,
    })
    setModalType('edit')
  }

  function openSubscriptionModal(importer: ImporterWithSubscription) {
    loadImporterDetails(importer.id)
    setSelectedImporter(importer)
    setSubscriptionForm({
      plan: importer.subscription?.plan || 'free',
      status: importer.subscription?.status || 'active',
    })
    setModalType('subscription')
  }

  function openAddModal() {
    setFormData({ business_name: '', email: '', phone: '', address: '', city: '', country: 'Ghana', currency: 'GHS' })
    setModalType('add')
  }

  if (!user?.auth) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Importers</h1>
          <p className="text-muted-foreground">Manage platform importers and subscriptions</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Importer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search importers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="input w-auto"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        
        <select 
          value={subscriptionFilter}
          onChange={(e) => setSubscriptionFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Plans</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Importers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Business</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Subscription</th>
                <th className="text-left p-4 font-medium">Users</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filteredImporters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No importers found
                  </td>
                </tr>
              ) : (
                filteredImporters.map((importer) => (
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
                      <button 
                        onClick={() => toggleActiveStatus(importer)}
                        className={`flex items-center gap-1 ${importer.is_active ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {importer.is_active ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                        <span className="text-sm">{importer.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${
                          importer.subscription_status === 'active' ? 'badge-success' : 
                          importer.subscription_status === 'trial' ? 'badge-warning' : 
                          'badge-danger'
                        }`}>
                          {importer.subscription?.plan || importer.subscription_status}
                        </span>
                        {importer.subscription?.price !== undefined && importer.subscription?.price > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ${importer.subscription.price}/mo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {importer.users_count}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {new Date(importer.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openViewModal(importer)}
                          className="p-2 hover:bg-muted rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openEditModal(importer)}
                          className="p-2 hover:bg-muted rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openSubscriptionModal(importer)}
                          className="p-2 hover:bg-muted rounded-lg"
                          title="Manage Subscription"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">
                {modalType === 'view' && 'Importer Details'}
                {modalType === 'edit' && 'Edit Importer'}
                {modalType === 'add' && 'Add New Importer'}
                {modalType === 'subscription' && 'Manage Subscription'}
              </h2>
              <button 
                onClick={() => { setModalType(null); setSelectedImporter(null) }}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {modalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* View Mode */}
                  {modalType === 'view' && selectedImporter && (
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{selectedImporter.business_name}</h3>
                          <p className="text-muted-foreground">/{selectedImporter.slug}</p>
                          <span className={`badge mt-2 ${
                            selectedImporter.is_active ? 'badge-success' : 'badge-danger'
                          }`}>
                            {selectedImporter.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Email</label>
                          <p className="font-medium">{selectedImporter.email}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Phone</label>
                          <p className="font-medium">{selectedImporter.phone || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Address</label>
                          <p className="font-medium">{selectedImporter.address || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">City</label>
                          <p className="font-medium">{selectedImporter.city || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Country</label>
                          <p className="font-medium">{selectedImporter.country}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Currency</label>
                          <p className="font-medium">{selectedImporter.currency}</p>
                        </div>
                      </div>
                      
                      {/* Subscription Details */}
                      {selectedImporter.subscription && (
                        <div className="border-t border-border pt-4">
                          <h4 className="font-semibold mb-3">Subscription Details</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">Plan</label>
                              <p className="font-medium capitalize">{selectedImporter.subscription.plan}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Status</label>
                              <p className={`font-medium capitalize ${
                                selectedImporter.subscription.status === 'active' ? 'text-green-600' : 'text-red-500'
                              }`}>
                                {selectedImporter.subscription.status}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Price</label>
                              <p className="font-medium">
                                ${selectedImporter.subscription.price}/{selectedImporter.subscription.billing_cycle}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Billing Period</label>
                              <p className="font-medium text-sm">
                                {selectedImporter.subscription.current_period_start && 
                                  new Date(selectedImporter.subscription.current_period_start).toLocaleDateString()
                                } - {
                                  selectedImporter.subscription.current_period_end && 
                                  new Date(selectedImporter.subscription.current_period_end).toLocaleDateString()
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Users */}
                      {selectedImporter.users && selectedImporter.users.length > 0 && (
                        <div className="border-t border-border pt-4">
                          <h4 className="font-semibold mb-3">Team Members ({selectedImporter.users.length})</h4>
                          <div className="space-y-2">
                            {selectedImporter.users.map(u => (
                              <div key={u.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="font-medium">{u.full_name || 'No name'}</p>
                                  <p className="text-sm text-muted-foreground">{u.email}</p>
                                </div>
                                <span className="badge badge-outline capitalize">{u.role}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-4 border-t border-border">
                        <button 
                          onClick={() => openEditModal(selectedImporter)}
                          className="btn btn-outline flex-1"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Details
                        </button>
                        <button 
                          onClick={() => openSubscriptionModal(selectedImporter)}
                          className="btn btn-primary flex-1"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Subscription
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Edit Mode */}
                  {modalType === 'edit' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Business Name</label>
                        <input
                          type="text"
                          value={formData.business_name}
                          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                          className="input mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="input mt-1"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="input mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Address</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="input mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">City</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="input mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Country</label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="input mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Currency</label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="input mt-1"
                        >
                          <option value="GHS">GHS - Ghana Cedis</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                        </select>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <button 
                          onClick={() => setModalType(null)}
                          className="btn btn-outline flex-1"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleUpdateImporter}
                          className="btn btn-primary flex-1"
                          disabled={!formData.business_name || !formData.email}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Add Mode */}
                  {modalType === 'add' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Business Name *</label>
                        <input
                          type="text"
                          value={formData.business_name}
                          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                          className="input mt-1"
                          placeholder="Enter business name"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="input mt-1"
                          placeholder="business@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="input mt-1"
                          placeholder="+233 XX XXX XXXX"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Address</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="input mt-1"
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">City</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="input mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Country</label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="input mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Currency</label>
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="input mt-1"
                        >
                          <option value="GHS">GHS - Ghana Cedis</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                        </select>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-primary" />
                          <span>A 14-day free trial will be created automatically</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <button 
                          onClick={() => setModalType(null)}
                          className="btn btn-outline flex-1"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleAddImporter}
                          className="btn btn-primary flex-1"
                          disabled={!formData.business_name || !formData.email}
                        >
                          Create Importer
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Subscription Mode */}
                  {modalType === 'subscription' && selectedImporter && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                        <Building2 className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-medium">{selectedImporter.business_name}</p>
                          <p className="text-sm text-muted-foreground">/{selectedImporter.slug}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Subscription Plan</label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {PLANS.map(plan => (
                            <button
                              key={plan.id}
                              onClick={() => setSubscriptionForm({ ...subscriptionForm, plan: plan.id })}
                              className={`p-4 border rounded-lg text-left transition-all ${
                                subscriptionForm.plan === plan.id 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:border-muted-foreground'
                              }`}
                            >
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-sm text-muted-foreground">${plan.price}/month</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Subscription Status</label>
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => setSubscriptionForm({ ...subscriptionForm, status: 'active' })}
                            className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                              subscriptionForm.status === 'active'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-border hover:border-muted-foreground'
                            }`}
                          >
                            <Check className="h-4 w-4" />
                            Active
                          </button>
                          <button
                            onClick={() => setSubscriptionForm({ ...subscriptionForm, status: 'cancelled' })}
                            className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                              subscriptionForm.status === 'cancelled'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-border hover:border-muted-foreground'
                            }`}
                          >
                            <X className="h-4 w-4" />
                            Cancelled
                          </button>
                        </div>
                      </div>
                      
                      {/* Current Period Info */}
                      {selectedImporter.subscription && (
                        <div className="p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Current Billing Period</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedImporter.subscription.current_period_start && 
                              new Date(selectedImporter.subscription.current_period_start).toLocaleDateString()
                            } - {
                              selectedImporter.subscription.current_period_end && 
                              new Date(selectedImporter.subscription.current_period_end).toLocaleDateString()
                            }
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-4 border-t border-border">
                        <button 
                          onClick={() => setModalType(null)}
                          className="btn btn-outline flex-1"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleUpdateSubscription}
                          className="btn btn-primary flex-1"
                        >
                          Update Subscription
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
