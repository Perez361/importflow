import { CURRENCY_SYMBOL } from '@/lib/constants'

/**
 * Format a number as currency (Ghana Cedis by default)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = CURRENCY_SYMBOL
): string {
  if (amount === null || amount === undefined) return `${currency}0.00`
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num)) return `${currency}0.00`
  
  return `${currency}${num.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format a date for display
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  return d.toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: string | Date | null | undefined
): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  return d.toLocaleString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(d)
}

/**
 * Format a number with commas
 */
export function formatNumber(
  num: number | string | null | undefined
): string {
  if (num === null || num === undefined) return '0'
  
  const n = typeof num === 'string' ? parseFloat(num) : num
  
  if (isNaN(n)) return '0'
  
  return n.toLocaleString('en-GH')
}

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format Ghana phone numbers
  if (cleaned.startsWith('233')) {
    const number = cleaned.slice(3)
    return `+233 ${number.slice(0, 2)} ${number.slice(2, 6)} ${number.slice(6)}`
  }
  
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  
  return phone
}

/**
 * Truncate text with ellipsis
 */
export function truncate(
  text: string | null | undefined,
  maxLength: number = 50
): string {
  if (!text) return ''
  
  if (text.length <= maxLength) return text
  
  return text.slice(0, maxLength - 3) + '...'
}
