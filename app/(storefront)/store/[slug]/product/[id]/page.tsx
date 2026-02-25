'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Package, ArrowLeft, Minus, Plus, ShoppingCart, Check } from 'lucide-react'
import type { Product, Importer } from '@/types/database'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [importer, setImporter] = useState<Importer | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!slug || !productId) return

    async function loadData() {
      // Load importer
      const importerResult = await supabase
        .from('importers')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (importerResult.data) {
        setImporter(importerResult.data as Importer)
      }

      // Load product
      const productResult = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      
      if (productResult.data) {
        setProduct(productResult.data as Product)
      }
      setLoading(false)
    }

    loadData()
  }, [slug, productId])

  const addToCart = () => {
    if (!product || !importer) return

    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: quantity,
      imageUrl: product.image_url || undefined
    }

    const cartKey = `cart_${slug}`
    const existingCart = localStorage.getItem(cartKey)
    const cart = existingCart ? JSON.parse(existingCart) : []
    
    // Check if product already in cart
    const existingIndex = cart.findIndex((item: { productId: string }) => item.productId === product.id)
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity
    } else {
      cart.push(cartItem)
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cart))
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!importer || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <Link href={`/store/${slug}`} className="btn btn-primary mt-4">
            Back to Store
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href={`/store/${slug}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Store
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <Package className="h-24 w-24 text-muted-foreground" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <span className="badge badge-outline mb-2">{product.category}</span>
            )}
            <h1 className="text-3xl font-bold mt-2">{product.name}</h1>
            {product.sku && (
              <p className="text-muted-foreground mt-1">SKU: {product.sku}</p>
            )}
          </div>

          <div>
            <p className="text-4xl font-bold">
              {importer.currency} {product.selling_price.toFixed(2)}
            </p>
            {product.cost_price && (
              <p className="text-muted-foreground mt-1">
                Cost: {importer.currency} {product.cost_price.toFixed(2)}
              </p>
            )}
          </div>

          {product.description && (
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Stock Status */}
          <div>
            {product.quantity > 0 ? (
              <span className="text-green-600 flex items-center gap-2">
                <Check className="h-4 w-4" />
                In Stock ({product.quantity} available)
              </span>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </div>

          {/* Quantity Selector */}
          {product.quantity > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  className="p-3 hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={addToCart}
                disabled={addedToCart}
                className={`btn flex-1 ${addedToCart ? 'btn-success' : 'btn-primary'}`}
              >
                <ShoppingCart className="h-4 w-4" />
                {addedToCart ? 'Added!' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Back to Cart Link */}
          <Link 
            href={`/store/${slug}/cart`} 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart
          </Link>
        </div>
      </div>
    </div>
  )
}
