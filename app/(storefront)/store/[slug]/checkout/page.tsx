'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ShoppingCart, CreditCard, Check } from 'lucide-react'
import type { Importer } from '@/types/database'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [importer, setImporter] = useState<Importer | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping')
  const [orderNumber, setOrderNumber] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    if (!slug) return

    async function loadData() {
      const importerResult = await supabase
        .from('importers')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (importerResult.data) {
        setImporter(importerResult.data as Importer)
      }
      
      const savedCart = localStorage.getItem(`cart_${slug}`)
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }
      setLoading(false)
    }

    loadData()
  }, [slug])

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Get importer_id
      const importerResult = await supabase
        .from('importers')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!importerResult.data) {
        throw new Error('Importer not found')
      }

      const importerId = importerResult.data.id

      // Create or get customer
      let customerId: string
      
      // Check if customer exists
      const existingCustomer = await supabase
        .from('customers')
        .select('id')
        .eq('importer_id', importerId)
        .eq('email', formData.email)
        .single()

      if (existingCustomer.data) {
        customerId = existingCustomer.data.id
      } else {
        // Create new customer
        const newCustomer = await supabase
          .from('customers')
          .insert({
            importer_id: importerId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city
          })
          .select()
          .single()
        
        if (!newCustomer.data) {
          throw new Error('Failed to create customer')
        }
        customerId = newCustomer.data.id
      }

      // Create order
      const orderNumber = `ORD-${Date.now()}`
      const order = await supabase
        .from('orders')
        .insert({
          importer_id: importerId,
          customer_id: customerId,
          order_number: orderNumber,
          subtotal: subtotal,
          total: subtotal,
          status: 'pending',
          shipping_name: formData.name,
          shipping_address: formData.address,
          shipping_city: formData.city
        })
        .select()
        .single()

      if (!order.data) {
        throw new Error('Failed to create order')
      }

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.data.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }))

      await supabase.from('order_items').insert(orderItems)

      // Clear cart
      localStorage.removeItem(`cart_${slug}`)
      
      setOrderNumber(orderNumber)
      setStep('confirmation')
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to process order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (cartItems.length === 0 && step !== 'confirmation') {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Your cart is empty</p>
        <Link href={`/store/${slug}`} className="btn btn-primary mt-4">
          Browse Products
        </Link>
      </div>
    )
  }

  if (step === 'confirmation') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Order Confirmed!</h1>
        <p className="text-muted-foreground mt-2">
          Thank you for your order. Your order number is:
        </p>
        <p className="text-xl font-bold mt-4">{orderNumber}</p>
        <p className="text-muted-foreground mt-4">
          We'll send you an email with order details and tracking information.
        </p>
        <Link href={`/store/${slug}`} className="btn btn-primary mt-6">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href={`/store/${slug}/cart`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping Info */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                    placeholder="Accra"
                  />
                </div>
              </div>
            </div>

            {/* Payment (placeholder) */}
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-4">Payment</h2>
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span>Cash on Delivery</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Payment will be collected upon delivery
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full"
            >
              {submitting ? 'Processing...' : `Place Order - ${importer.currency} ${subtotal.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="card p-6 h-fit">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name} x {item.quantity}
                </span>
                <span>{importer.currency} {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-3">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{importer.currency} {subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
