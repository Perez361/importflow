'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Product } from '@/types/database'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  MoreVertical,
  Filter,
} from 'lucide-react'

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProducts = useCallback(async () => {
    if (!user?.profile?.importer_id) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('importer_id', user.profile.importer_id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.profile?.importer_id, supabase])

  useEffect(() => {
    if (!authLoading && user?.profile?.importer_id) {
      fetchProducts()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading, fetchProducts])

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (!error) {
        setProducts(products.filter(p => p.id !== productId))
        setShowDeleteModal(null)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentStatus })
        .eq('id', productId)

      if (!error) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, is_available: !currentStatus } : p
        ))
      }
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesCategory = !filterCategory || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(products.map(p => p.category).filter((c): c is string => Boolean(c)))]
  const lowStockCount = products.filter(p => p.quantity <= p.low_stock_threshold).length

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">
            Manage your product inventory
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add Product</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{products.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Total</p>
            </div>
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{products.filter(p => p.is_available).length}</p>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Available</p>
            </div>
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{lowStockCount}</p>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Low Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input w-full sm:w-auto min-w-[140px]"
        >
          <option value="">All</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products - Mobile Card / Desktop Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 md:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 md:p-8 text-center">
            <Package className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50 mx-auto" />
            <p className="mt-4 text-muted-foreground">
              {products.length === 0 ? 'No products yet. Add your first product!' : 'No products match your search.'}
            </p>
            {products.length === 0 && (
              <Link href="/products/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.sku || 'No SKU'} • {product.category || 'Uncategorized'}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      product.is_available ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{formatCurrency(product.selling_price)}</p>
                      <p className={`text-sm ${product.quantity <= product.low_stock_threshold ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                        {product.quantity <= product.low_stock_threshold && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                        {product.quantity} in stock
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/products/${product.id}`} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg touch-manipulation">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setShowDeleteModal(product.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg touch-manipulation">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            {product.description && <p className="text-sm text-muted-foreground truncate max-w-xs">{product.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{product.sku || '-'}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{product.category || '-'}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">{formatCurrency(product.selling_price)}</p>
                        {product.cost_price && <p className="text-sm text-muted-foreground">Cost: {formatCurrency(product.cost_price)}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 text-sm ${product.quantity <= product.low_stock_threshold ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                          {product.quantity <= product.low_stock_threshold && <AlertTriangle className="h-4 w-4" />}
                          {product.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleAvailability(product.id, product.is_available)} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full touch-manipulation ${product.is_available ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                          {product.is_available ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/products/${product.id}`} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg touch-manipulation">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button onClick={() => setShowDeleteModal(product.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg touch-manipulation">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-4 md:p-6 max-w-sm md:max-w-md w-full mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-foreground">Delete Product</h3>
            <p className="mt-2 text-muted-foreground">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="mt-4 md:mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition touch-manipulation">
                Cancel
              </button>
              <button onClick={() => handleDelete(showDeleteModal)} className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg transition touch-manipulation">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
