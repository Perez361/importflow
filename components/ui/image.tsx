'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallback?: string
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/file.svg',
  className,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false)

  const handleError = () => {
    setError(true)
  }

  return (
    <Image
      src={error ? fallback : src}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  )
}

// Avatar component with fallback
interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ src, alt = 'Avatar', size = 'md', className = '' }: AvatarProps) {
  const [error, setError] = useState(false)

  const sizeClass = sizeClasses[size]

  if (!src || error) {
    return (
      <div className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center ${className}`}>
        <span className="font-medium text-primary">
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={64}
        height={64}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  )
}

// Product image with lazy loading
interface ProductImageProps {
  src?: string | null
  alt: string
  className?: string
}

export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={`object-cover rounded-lg ${className}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}

