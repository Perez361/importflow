'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Package, Search, MapPin, Mail, Phone } from 'lucide-react'
import type { Product, Importer } from '@/types/database'

export default function StorefrontPage() {
  const params = useParams()
  const slug = params.slug as string
  const [products, setProducts] = useState<Product[]>([])
  const [importer, setImporter] = useState<Importer | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!slug) return

    async function loadData() {
      // Load importer
      const importerResult = await supabase
        .from('importers')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (importerResult.data) {
        const importerData = importerResult.data as Importer
        setImporter(importerData)
        
        // Set browser tab title to business name
        if (importerData.business_name) {
          document.title = importerData.business_name
        }
        
        // Load available products for this importer
        const productsResult = await supabase
          .from('products')
          .select('*')
          .eq('importer_id', importerData.id)
          .eq('is_available', true)
          .order('created_at', { ascending: false })
        
        if (productsResult.data) {
          setProducts(productsResult.data as Product[])
        }
      }
      setLoading(false)
    }

    loadData()
  }, [slug])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!importer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Store Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section with Logo and Business Info */}
      <div className="card p-8 text-center space-y-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex justify-center">
          {importer.logo_url ? (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-background shadow-lg">
              <img 
                src={importer.logo_url} 
                alt={importer.business_name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Package className="h-12 w-12 md:h-16 md:w-16 text-primary" />
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {importer.business_name}
          </h1>
          {importer.address && (
            <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              {importer.address}{importer.city ? `, ${importer.city}` : ''}{importer.country ? `, ${importer.country}` : ''}
            </p>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
          {importer.email && (
            <a href={`mailto:${importer.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
              <Mail className="h-4 w-4" />
              {importer.email}
            </a>
          )}
          {importer.phone && (
            <a href={`tel:${importer.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="h-4 w-4" />
              {importer.phone}
            </a>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No products available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Link 
              key={product.id} 
              href={`/store/${slug}/product/${product.id}`}
              className="card card-hover overflow-hidden"
            >
              <div className="aspect-square bg-muted flex items-center justify-center">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{product.name}</h3>
                {product.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                )}
                <p className="text-lg font-bold mt-2">
                  {importer.currency} {product.selling_price.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Without shipping fee
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
