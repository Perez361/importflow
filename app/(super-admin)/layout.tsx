'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { Header } from '@/components/layout/header'
import { Loader2, Package, Users, Building2, Menu, X } from 'lucide-react'

// Helper to get cached role from sessionStorage
const getCachedRole = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    const profile = sessionStorage.getItem('userProfile')
    if (profile) {
      return JSON.parse(profile).role
    }
  } catch (e) {
    // Ignore
  }
  return null
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { loading, isAuthenticated, isSuperAdmin, user, refreshProfile, isInitialized } = useAuth()
  const [profileLoading, setProfileLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const initProfile = async () => {
      if (loading) return
      
      if (isAuthenticated && !user.profile) {
        await refreshProfile()
      }
      setProfileLoading(false)
    }
    
    initProfile()
  }, [loading, isAuthenticated, user.profile, refreshProfile])

  useEffect(() => {
    // Don't redirect until auth is fully initialized
    if (!isInitialized) return
    
    // Check both state and cached profile for role
    const cachedRole = getCachedRole()
    const isSuperAdminUser = isSuperAdmin || cachedRole === 'super_admin'
    
    if (!loading && !profileLoading && !isAuthenticated && !cachedRole) {
      router.push('/login')
    } else if (!loading && !profileLoading && isAuthenticated && !isSuperAdminUser) {
      router.push('/dashboard')
    }
  }, [loading, profileLoading, isAuthenticated, isSuperAdmin, router, isInitialized])

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header with user profile - hide store link for super admins */}
      <Header onMenuClick={() => setMobileMenuOpen(true)} showStoreLink={false} />

      <div className="flex-1 flex">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:relative z-50 bg-card border-r border-border transition-transform duration-300 h-[calc(100vh-64px)] top-16
          w-64
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-14 px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold">ImportFlow</span>
                <span className="badge-primary text-xs">Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <Link 
                href="/admin" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                <Building2 className="h-5 w-5" />
                Dashboard
              </Link>
              <Link 
                href="/admin/importers" 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                <Users className="h-5 w-5" />
                Importers
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)]">
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
