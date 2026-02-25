'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
  Package as PackageIcon,
  Sparkles,
  X,
  MessageSquare,
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Shipments', href: '/shipments', icon: Truck },
  { name: 'Finances', href: '/finances', icon: DollarSign },
  { name: 'Storefront', href: '/storefront', icon: Store },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
  isMobileOpen?: boolean
}

export function Sidebar({ onClose, isMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-card border-r border-border transition-all duration-300 h-screen fixed lg:relative z-50',
          // Mobile positioning
          isMobile && isMobileOpen ? 'translate-x-0' : isMobile ? '-translate-x-full' : '',
          // Desktop sizing
          collapsed ? 'w-16' : 'w-64',
          // Always show on desktop
          'lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <PackageIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">
                ImportFlow
              </span>
              <span className="badge-primary text-xs">
                PRO
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                <PackageIcon className="h-5 w-5 text-white" />
              </div>
            </Link>
          )}
          
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {/* Desktop collapse button - hide on mobile */}
          {!isMobile && !collapsed && !onClose && (
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {!isMobile && collapsed && !onClose && (
            <button
              onClick={toggleCollapsed}
              className="absolute -right-3 top-20 p-1 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive && 'text-primary'
                )} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        {!collapsed && !isMobile && !onClose && (
          <div className="p-4 border-t border-border">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-blue-600 p-4 text-white">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <Sparkles className="h-5 w-5 mb-2" />
              <p className="text-sm font-semibold">Need help?</p>
              <p className="text-xs text-white/80 mt-1">
                Check our docs or contact support.
              </p>
              <button className="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors font-medium">
                View Docs
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
