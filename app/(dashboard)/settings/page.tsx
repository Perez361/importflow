'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Settings, Building2, Mail, Phone, MapPin, Globe, Save, Upload, X, Image as ImageIcon } from 'lucide-react'
import type { Importer } from '@/types/database'

export default function SettingsPage() {
  const [importer, setImporter] = useState<Importer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    currency: 'GHS',
    slug: '',
    logo_url: ''
  })

  useEffect(() => {
    async function loadImporter() {
      if (!user?.profile?.importer_id) return
      
      const result = await supabase
        .from('importers')
        .select('*')
        .eq('id', user.profile.importer_id)
        .single()
      
      if (result.data) {
        const imp = result.data as Importer
        setImporter(imp)
        setFormData({
          business_name: imp.business_name,
          email: imp.email,
          phone: imp.phone || '',
          address: imp.address || '',
          city: imp.city || '',
          country: imp.country,
          currency: imp.currency,
          slug: imp.slug,
          logo_url: imp.logo_url || ''
        })
        if (imp.logo_url) {
          setLogoPreview(imp.logo_url)
        }
      }
      setLoading(false)
    }

    loadImporter()
  }, [user])

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setMessage(null)
  }

  async function handleRemoveLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData({ ...formData, logo_url: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function uploadLogo(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('importer-logos')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading logo:', uploadError)
      setMessage({ type: 'error', text: 'Failed to upload logo' })
      return null
    }

    const { data } = supabase.storage
      .from('importer-logos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      let finalLogoUrl = formData.logo_url

      // Upload new logo if selected
      if (logoFile) {
        setUploading(true)
        const uploadedUrl = await uploadLogo(logoFile)
        setUploading(false)
        
        if (!uploadedUrl) {
          setSaving(false)
          return
        }
        finalLogoUrl = uploadedUrl
      }

      const { error } = await supabase
        .from('importers')
        .update({
          business_name: formData.business_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          currency: formData.currency,
          logo_url: finalLogoUrl
        })
        .eq('id', user?.profile?.importer_id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      
      // Clear the file input after successful save
      if (logoFile) {
        setLogoFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (!user?.auth) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business settings</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {message && (
            <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {/* Logo Upload */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg">Business Logo</h2>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
            />

            {logoPreview ? (
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-xl overflow-hidden border border-border bg-muted">
                  <img 
                    src={logoPreview} 
                    alt="Business logo preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm">Upload Logo</span>
              </button>
            )}

            <p className="text-sm text-muted-foreground mt-2">
              Recommended: Square image, max 5MB. This logo will appear on your storefront.
            </p>
          </div>

          {/* Business Info */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg">Business Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Business Name</label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Store URL</label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">importflow.app/store/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    disabled
                    className="input bg-muted"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-lg">Regional Settings</h2>
            </div>

            <div>
              <label className="label">Currency</label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="input"
              >
                <option value="GHS">GHS - Ghana Cedis</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="NGN">NGN - Nigerian Naira</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="btn btn-primary"
          >
            <Save className="h-4 w-4" />
            {saving || uploading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  )
}
