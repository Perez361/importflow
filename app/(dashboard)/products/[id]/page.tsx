'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { ArrowLeft, Save, Trash2, Loader2, Upload, X } from 'lucide-react'
import type { Product } from '@/types/database'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    cost_price: 0,
    selling_price: 0,
    quantity: 0,
    low_stock_threshold: 5,
    is_available: true,
    image_url: ''
  })

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return

      const result = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (result.data) {
        const product = result.data as Product
        setFormData({
          name: product.name || '',
          description: product.description || '',
          sku: product.sku || '',
          category: product.category || '',
          cost_price: product.cost_price || 0,
          selling_price: product.selling_price || 0,
          quantity: product.quantity || 0,
          low_stock_threshold: product.low_stock_threshold || 5,
          is_available: product.is_available ?? true,
          image_url: product.image_url || ''
        })
        setPreviewUrl(product.image_url || null)
      }
      setLoading(false)
    }

    loadProduct()
  }, [productId])

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleRemoveImage() {
    setImageFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setFormData({ ...formData, image_url: '' })
  }

  async function uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      let finalImageUrl: string = formData.image_url

      // Upload new image if selected
      if (imageFile) {
        setUploading(true)
        const uploadedUrl = await uploadImage(imageFile)
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl
        }
        setUploading(false)
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          sku: formData.sku,
          category: formData.category,
          cost_price: formData.cost_price,
          selling_price: formData.selling_price,
          quantity: formData.quantity,
          low_stock_threshold: formData.low_stock_threshold,
          is_available: formData.is_available,
          image_url: finalImageUrl
        })
        .eq('id', productId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Product updated successfully!' })
      
      // Clear the file input after successful save
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update product' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      router.push('/products')
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete product' })
      setDeleting(false)
    }
  }

  const margin = formData.selling_price > 0 
    ? ((formData.selling_price - formData.cost_price) / formData.selling_price * 100).toFixed(1)
    : '0'

  if (!user?.auth) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">Update product information</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn btn-danger"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="card p-6">
                <h2 className="font-semibold text-lg mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Product description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">SKU</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        className="input"
                        placeholder="SKU-001"
                      />
                    </div>
                    <div>
                      <label className="label">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="input"
                        placeholder="Electronics"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="card p-6">
                <h2 className="font-semibold text-lg mb-4">Pricing</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.selling_price}
                      onChange={e => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    Margin: <span className="font-bold">{margin}%</span>
                  </p>
                </div>
              </div>

              {/* Inventory */}
              <div className="card p-6">
                <h2 className="font-semibold text-lg mb-4">Inventory</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Low Stock Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Available for purchase</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Image */}
              <div className="card p-6">
                <h2 className="font-semibold text-lg mb-4">Product Image</h2>
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="relative">
                      <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                        <img 
                          src={previewUrl} 
                          alt="Product preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-secondary flex-1"
                        >
                          <Upload className="h-4 w-4" />
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="btn btn-ghost text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Upload Image</span>
                    </button>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Recommended: Square image, max 5MB
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving || uploading}
                className="btn btn-primary w-full"
              >
                <Save className="h-4 w-4" />
                {saving || uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
