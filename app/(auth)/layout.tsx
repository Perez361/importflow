import type { Metadata } from 'next'
import Link from 'next/link'
import { Package } from 'lucide-react'

// Force dynamic rendering to avoid prerender errors with Supabase
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ImportFlow - Authentication',
  description: 'Sign in to your ImportFlow account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 mesh-gradient-light" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">ImportFlow</span>
            <span className="badge-pro badge-pro-glow">PRO</span>
          </Link>
        </div>
        
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Manage your import business with
            <span className="text-gradient block mt-2">confidence</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Join hundreds of importers across Africa who trust ImportFlow PRO to manage their products, track shipments, and grow their business.
          </p>
          
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan-500 border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">500+</span> businesses trust us
            </p>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-muted-foreground">
          © {new Date().getFullYear()} ImportFlow PRO. All rights reserved.
        </div>
      </div>
      
      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center p-8">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">ImportFlow</span>
              <span className="badge-pro badge-pro-glow">PRO</span>
            </Link>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}
