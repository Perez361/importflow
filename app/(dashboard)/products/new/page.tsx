'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function NewProductPage() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  const supabase = createClient()
  const { user } = useAuth()

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
    setImageUrl(null)
  }

  async function handleRemoveImage() {
    setImageFile(null)
    setPreviewUrl(null)
    setImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!user.auth) return
    
    setLoading(true)

    try {
      const userResult = await supabase
        .from('users')
        .select('importer_id')
        .eq('id', user.auth.id)
        .single()

      if (!userResult.data?.importer_id) {
        alert('Error getting importer info')
        return
      }

      const form = e.currentTarget
      const nameInput = form.elements.namedItem('name') as HTMLInputElement
      const skuInput = form.elements.namedItem('sku') as HTMLInputElement
      const categoryInput = form.elements.namedItem('category') as HTMLInputElement
      const priceInput = form.elements.namedItem('price') as HTMLInputElement
      const costPriceInput = form.elements.namedItem('cost_price') as HTMLInputElement
      const quantityInput = form.elements.namedItem('quantity') as HTMLInputElement
      const descriptionInput = form.elements.namedItem('description') as HTMLTextAreaElement

      let finalImageUrl = imageUrl

      // Upload image if selected
      if (imageFile) {
        setUploading(true)
        finalImageUrl = await uploadImage(imageFile)
        setUploading(false)
      }

      await supabase.from('products').insert({
        importer_id: userResult.data.importer_id,
        name: nameInput.value,
        sku: skuInput.value || null,
        category: categoryInput.value || null,
        selling_price: parseFloat(priceInput.value) || 0,
        cost_price: costPriceInput.value ? parseFloat(costPriceInput.value) : null,
        quantity: quantityInput.value ? parseInt(quantityInput.value) : 0,
        description: descriptionInput.value || null,
        image_url: finalImageUrl,
      })

      router.push('/products')
    } catch (error) {
      console.error(error)
      alert('Error saving product')
    } finally {
      setLoading(false)
    }
  }

  if (!user.auth) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products" className="btn btn-ghost btn-sm">
          Back
        </Link>
        <h1 className="text-2xl font-bold">Add Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Image */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Product Image</h2>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {previewUrl || imageUrl ? (
            <div className="relative inline-block">
              <div className="w-48 h-48 rounded-xl overflow-hidden border border-border bg-muted">
                <img 
                  src={previewUrl || imageUrl || ''} 
                  alt="Product preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-48 h-48 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm">Upload Image</span>
            </button>
          )}

          <p className="text-sm text-muted-foreground mt-2">
            Recommended: Square image, max 5MB
          </p>
        </div>

        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Product Name *</label>
              <input 
                required 
                type="text" 
                name="name" 
                className="input" 
                placeholder="Enter product name"
              />
            </div>

            <div className="form-group">
              <label className="label">SKU</label>
              <input 
                type="text" 
                name="sku" 
                className="input" 
                placeholder="Enter SKU (optional)"
              />
            </div>

            <div className="form-group">
              <label className="label">Category</label>
              <input 
                type="text" 
                name="category" 
                className="input" 
                placeholder="Enter category (optional)"
              />
            </div>

            <div className="form-group">
              <label className="label">Selling Price *</label>
              <input 
                required 
                type="number" 
                name="price" 
                className="input" 
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="label">Cost Price</label>
              <input 
                type="number" 
                name="cost_price" 
                className="input" 
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="label">Quantity in Stock</label>
              <input 
                type="number" 
                name="quantity" 
                className="input" 
                placeholder="0"
                min="0"
                defaultValue="0"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="form-group">
              <label className="label">Description</label>
              <textarea 
                name="description" 
                className="input min-h-[100px]" 
                placeholder="Enter product description (optional)"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            type="submit" 
            disabled={loading || uploading}
            className="btn btn-primary"
          >
            {loading || uploading ? 'Saving...' : 'Save Product'}
          </button>
          <Link href="/products" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
