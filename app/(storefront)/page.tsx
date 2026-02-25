'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Store, ExternalLink } from 'lucide-react'
import type { Importer } from '@/types/database'

export default function StorefrontIndexPage() {
  const [importers, setImporters] = useState<Importer[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    async function loadStorefronts() {
      const result = await supabase
        .from('importers')
        .select('id, business_name, slug, logo_url, is_active')
        .eq('is_active', true)
        .limit(20)
      
      if (result.data) {
        setImporters(result.data as Importer[])
      }
      setLoading(false)
    }

    loadStorefronts()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Discover Amazing Stores</h1>
          <p className="text-xl text-muted-foreground">
            Browse products from our verified importers
          </p>
        </div>

        {importers.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No stores available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {importers.map((importer) => (
              <a
                key={importer.id}
                href={`/store/${importer.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-hover p-6 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  {importer.logo_url ? (
                    <img 
                      src={importer.logo_url} 
                      alt={importer.business_name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Store className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{importer.business_name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    /store/{importer.slug}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
