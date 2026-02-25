'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { User, Mail, Building2, Shield, Camera, Loader2 } from 'lucide-react'
import type { Importer } from '@/types/database'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [importer, setImporter] = useState<Importer | null>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    async function loadData() {
      // Wait for auth to be ready
      if (!user?.auth) {
        setLoading(false)
        return
      }

      // Fetch user data including avatar
      if (user.profile?.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.profile.id)
          .single()
        
        if (userData) {
          setAvatarUrl(userData.avatar_url)
        }
      }

      // If user has an importer_id, fetch the importer data
      if (user.profile?.importer_id) {
        const { data, error } = await supabase
          .from('importers')
          .select('*')
          .eq('id', user.profile.importer_id)
          .single()

        if (data && !error) {
          setImporter(data as Importer)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [user, supabase])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.profile?.id) return

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileName = `avatars/${user.profile.id}/${Date.now()}_${file.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        setUploading(false)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.profile.id)

      if (updateError) {
        console.error('Error updating avatar:', updateError)
        setUploading(false)
        return
      }

      setAvatarUrl(publicUrl)
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  // Show loading while auth is being checked or data is being loaded
  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user?.auth) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Account Information</h2>
          </div>
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-zinc-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">Click to upload a profile picture</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label block text-sm font-medium mb-1">Full Name</label>    
              <p className="text-foreground">{user.profile?.full_name || 'Not set'}</p>
            </div>

            <div>
              <label className="label block text-sm font-medium mb-1">Email</label>    
              <p className="text-foreground">{user.auth?.email || 'Not set'}</p>
            </div>

            <div>
              <label className="label block text-sm font-medium mb-1">Role</label>    
              <p className="text-foreground capitalize">{user.profile?.role || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Importer Profile Card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-lg">Business Information</h2>
          </div>
          
          {importer ? (
            <div className="space-y-4">
              <div>
                <label className="label block text-sm font-medium mb-1">Business Name</label>    
                <p className="text-foreground">{importer.business_name || 'Not set'}</p>
              </div>

              <div>
                <label className="label block text-sm font-medium mb-1">Country</label>    
                <p className="text-foreground">{importer.country || 'Not set'}</p>
              </div>

              <div>
                <label className="label block text-sm font-medium mb-1">Currency</label>    
                <p className="text-foreground">{importer.currency || 'Not set'}</p>
              </div>

              <div>
                <label className="label block text-sm font-medium mb-1">Store URL</label>    
                <a 
                  href={`/store/${importer.slug}`}
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  importflow.app/store/{importer.slug}
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-yellow-600">No importer profile found.</p>
          )}
        </div>
      </div>
    </div>
   )
}
