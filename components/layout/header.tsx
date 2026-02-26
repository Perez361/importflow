'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { getInitials } from '@/lib/utils/helpers'
import { createClient } from '@/lib/supabase/client'
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  Store,
  ChevronDown,
  ExternalLink,
  X,
} from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
  showStoreLink?: boolean
}

export function Header({ onMenuClick, showStoreLink = true }: HeaderProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [storeSlug, setStoreSlug] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      if (!user.profile?.id) return

      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.profile.id)
        .single()
      
      if (userData?.avatar_url) {
        setAvatarUrl(userData.avatar_url)
      }

      if (user.profile?.importer_id) {
        const { data: importer } = await supabase
          .from('importers')
          .select('slug')
          .eq('id', user.profile.importer_id)
          .single()
        
        if (importer) {
          setStoreSlug(importer.slug)
        }
      }
    }
    
    if (user.profile?.id) {
      fetchData()
    }
  }, [user.profile?.id, user.profile?.importer_id, supabase])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsMobileSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Error signing out:', error.message)
        window.location.href = '/login'
      }
    } catch (err) {
      console.error('Unexpected error during sign out:', err)
      window.location.href = '/login'
    }
  }

  const displayName = user.profile?.full_name || user.profile?.email?.split('@')[0] || 'User'
  const isSuperAdmin = user.profile?.role === 'super_admin'

  return (
    <>
      <header className="h-16 bg-card/80 backdrop-blur-lg border-b border-border flex items-center justify-between px-3 lg:px-6 sticky top-0 z-20">
        <div className="flex items-center gap-2 lg:gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div ref={searchRef} className="hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search products, orders..."
                className="w-48 lg:w-72 pl-10 pr-4 py-2 bg-muted/50 border border-transparent rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-background transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>

          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
            aria-label="Toggle search"
          >
            {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          {isMobileSearchOpen && (
            <div className="absolute top-16 left-0 right-0 p-3 bg-card border-b border-border md:hidden animate-fade-in-down z-30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                  autoFocus
                />
              </div>
            </div>
          )}

          {showStoreLink && !isSuperAdmin && (
            storeSlug ? (
              <Link
                href={`/store/${storeSlug}`}
                target="_blank"
                className="hidden sm:flex items-center gap-2 px-2 lg:px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors group touch-manipulation"
              >
                <Store className="h-4 w-4" />
                <span className="hidden md:inline">View Store</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ) : (
              <Link
                href="/storefront"
                className="hidden sm:flex items-center gap-2 px-2 lg:px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors touch-manipulation"
              >
                <Store className="h-4 w-4" />
                <span className="hidden md:inline">View Store</span>
              </Link>
            )
          )}

          {/* Notifications - Fixed for mobile */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors touch-manipulation"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card" />
            </button>

            {showNotifications && (
              <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowNotifications(false)} />
            )}

            {showNotifications && (
              <div className="absolute right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 mt-2 w-[calc(100vw-16px)] sm:w-80 max-w-[360px] bg-card rounded-xl shadow-soft-lg border border-border py-2 z-50 animate-scale-in">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    Notifications
                  </h3>
                  <span className="badge badge-primary text-xs">2 new</span>
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-thin">
                  <div className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400 text-sm">🛒</span>
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          New order received
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Order #ORD-001 from John Doe
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          2 minutes ago
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm">⚠️</span>
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          Low stock alert
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Product A is running low (3 left)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          1 hour ago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-border">
                  <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted transition-colors touch-manipulation"
              aria-label="User menu"
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {user.profile?.full_name ? getInitials(user.profile.full_name) : 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.profile?.role || 'user'}
                </p>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-56 bg-card rounded-xl shadow-soft-lg border border-border py-2 z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.profile?.email}
                  </p>
                </div>
                
                <div className="py-1">
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-border pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
