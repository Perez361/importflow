'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAuth } from '@/lib/hooks/use-auth'
import { Loader2, Package } from 'lucide-react'

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { loading, isAuthenticated, isSuperAdmin, user, isInitialized } = useAuth()

  // Redirect if not authenticated or if user is a super admin (they should go to /admin)
  useEffect(() => {
    // Don't redirect until auth is fully initialized
    if (!isInitialized) return
    
    // Check both state and cached profile for role
    const cachedRole = getCachedRole()
    const isSuperAdminUser = isSuperAdmin || cachedRole === 'super_admin'
    
    if (!loading && !isAuthenticated && !cachedRole) {
      router.push('/login')
    }
    
    // Prevent super admins from accessing importer dashboard - redirect to admin
    if (!loading && isAuthenticated && isSuperAdminUser) {
      router.push('/admin')
    }
  }, [loading, isAuthenticated, isSuperAdmin, router, isInitialized])

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || isSuperAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile Sidebar with proper drawer behavior */}
      {!isSuperAdmin && (
        <Sidebar 
          onClose={() => setMobileMenuOpen(false)} 
          isMobileOpen={mobileMenuOpen}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
