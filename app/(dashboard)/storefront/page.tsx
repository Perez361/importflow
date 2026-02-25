'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Store, ExternalLink, Copy, Check, Edit } from 'lucide-react'
import Link from 'next/link'
import type { Importer } from '@/types/database'

export default function StorefrontPage() {
  const { user, loading: authLoading } = useAuth()
  const [importer, setImporter] = useState<Importer | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && user?.profile) {
      fetchImporter()
    }
  }, [authLoading, user])

  const fetchImporter = async () => {
    try {
      const { data, error } = await supabase
        .from('importers')
        .select('*')
        .eq('id', user!.profile!.importer_id!)
        .single()

      if (!error && data) {
        setImporter(data)
      }
    } catch (error) {
      console.error('Error fetching importer:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyStoreUrl = () => {
    if (importer?.slug) {
      const url = `${window.location.origin}/store/${importer.slug}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user?.profile?.importer_id) {
    return (
      <div className="text-center py-12">
        <Store className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">No Store Found</h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          You need to be associated with an importer to manage a storefront.
        </p>
      </div>
    )
  }

  const storeUrl = importer?.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/store/${importer.slug}` : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Storefront</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your online store and share it with customers
        </p>
      </div>

      {/* Store Status Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${importer?.is_active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              <Store className={`h-6 w-6 ${importer?.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {importer?.business_name || 'Your Store'}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Status: {importer?.is_active ? (
                  <span className="text-green-600 dark:text-green-400">Active</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Inactive</span>
                )}
              </p>
            </div>
          </div>
          <Link
            href={`/store/${importer?.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <ExternalLink className="h-4 w-4" />
            View Store
          </Link>
        </div>

        {/* Store URL */}
        {importer?.slug && (
          <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Store URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={storeUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-400"
              />
              <button
                onClick={copyStoreUrl}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg transition"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Store Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Store Slug</h3>
          <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white">
            {importer?.slug || 'Not set'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Store Status</h3>
          <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white">
            {importer?.is_active ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Contact Email</h3>
          <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white truncate">
            {importer?.email || 'Not set'}
          </p>
        </div>
      </div>

      {/* Store Settings */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Store Information</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Business Name
            </label>
            <p className="text-zinc-900 dark:text-white">{importer?.business_name || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Contact Phone
            </label>
            <p className="text-zinc-900 dark:text-white">{importer?.phone || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Address
            </label>
            <p className="text-zinc-900 dark:text-white">{importer?.address || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              City
            </label>
            <p className="text-zinc-900 dark:text-white">{importer?.city || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Country
            </label>
            <p className="text-zinc-900 dark:text-white">{importer?.country || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Created
            </label>
            <p className="text-zinc-900 dark:text-white">
              {importer?.created_at ? new Date(importer.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
