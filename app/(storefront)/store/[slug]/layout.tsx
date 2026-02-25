'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ShoppingCart, Package, User, LogIn, UserPlus, LogOut, Menu, X, MessageSquare } from 'lucide-react'
import type { Importer } from '@/types/database'

interface StoreCustomer {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = params.slug as string
  const [importer, setImporter] = useState<Importer | null>(null)
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<StoreCustomer | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lastCustomerRef = useRef<string>('')
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load customer from localStorage
  const loadCustomer = () => {
    if (!slug) return
    const storedCustomer = localStorage.getItem(`customer_${slug}`)
    const customerJson = storedCustomer || ''
    
    if (customerJson !== lastCustomerRef.current) {
      lastCustomerRef.current = customerJson
      if (storedCustomer) {
        try {
          setCustomer(JSON.parse(storedCustomer))
        } catch (e) {
          console.error('Error parsing customer session:', e)
          setCustomer(null)
        }
      } else {
        setCustomer(null)
      }
    }
  }

  // Check for logged in customer and load importer
  useEffect(() => {
    if (!slug) return

    loadCustomer()

    async function loadImporter() {
      const result = await supabase
        .from('importers')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (result.data) {
        const importerData = result.data as Importer
        setImporter(importerData)
        
        // Set browser tab title to business name
        if (importerData.business_name) {
          document.title = importerData.business_name
        }
      }
      setLoading(false)
    }

    loadImporter()
  }, [slug])

  const handleSignOut = () => {
    localStorage.removeItem(`customer_${slug}`)
    lastCustomerRef.current = ''
    setCustomer(null)
    setShowUserMenu(false)
    window.location.href = `/store/${slug}`
  }

  // Poll for localStorage changes
  useEffect(() => {
    if (!slug) return

    const interval = setInterval(() => {
      loadCustomer()
    }, 1000)

    return () => clearInterval(interval)
  }, [slug])

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `customer_${slug}`) {
        loadCustomer()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [slug])

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          <p className="text-muted-foreground mt-2">This store does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo */}
            <Link href={`/store/${slug}`} className="flex items-center gap-2">
              {importer.logo_url ? (
                <img src={importer.logo_url} alt={importer.business_name} className="h-7 w-7 md:h-8 md:w-8 object-contain" />
              ) : (
                <Package className="h-7 w-7 md:h-8 md:w-8" />
              )}
              <span className="font-bold text-lg md:text-xl hidden sm:inline">{importer.business_name}</span>
              <span className="font-bold text-lg md:text-xl sm:hidden">{importer.business_name.substring(0, 12)}{importer.business_name.length > 12 ? '...' : ''}</span>
            </Link>
            
            {/* Right side actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Login / Register or Account buttons */}
              {customer ? (
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 hover:bg-muted rounded-lg touch-manipulation"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {customer.avatar_url ? (
                        <img src={customer.avatar_url} alt={customer.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      )}
                    </div>
                    <span className="hidden md:inline text-sm font-medium">{customer.name}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-2 z-50 animate-scale-in">
                      <Link 
                        href={`/store/${slug}/account`}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                      <Link 
                        href={`/store/${slug}/messages`}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Messages
                      </Link>
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 md:gap-2">
                  <Link 
                    href={`/store/${slug}/login`}
                    className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 text-sm hover:bg-muted rounded-lg touch-manipulation"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                  <Link 
                    href={`/store/${slug}/register`}
                    className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg touch-manipulation"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Create Account</span>
                  </Link>
                </div>
              )}
              
              <Link href={`/store/${slug}/cart`} className="p-2 hover:bg-muted rounded-lg touch-manipulation relative">
                <ShoppingCart className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border animate-fade-in-down">
            <div className="container px-3 py-3 space-y-2">
              <Link 
                href={`/store/${slug}`}
                className="block px-3 py-2 text-sm hover:bg-muted rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href={`/store/${slug}/cart`}
                className="block px-3 py-2 text-sm hover:bg-muted rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
              </Link>
              {customer && (
                <>
                  <Link 
                    href={`/store/${slug}/account`}
                    className="block px-3 py-2 text-sm hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link 
                    href={`/store/${slug}/messages`}
                    className="block px-3 py-2 text-sm hover:bg-muted rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Messages
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-3 md:px-4 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 text-center text-sm text-muted-foreground">
          Powered by ImportFlow
        </div>
      </footer>
    </div>
  )
}
