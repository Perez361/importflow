'use client'

import { Component, ReactNode, useState } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <Link href="/dashboard">
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-input bg-background rounded-lg hover:bg-muted transition">
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple error fallback component for use in pages
export function ErrorFallback({ 
  message = 'An error occurred',
  onRetry 
}: { 
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {message}
        </h2>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition mt-4"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

// Hook for handling errors in components
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null)

  const handleError = (err: Error) => {
    console.error('Error:', err)
    setError(err)
  }

  const clearError = () => {
    setError(null)
  }

  return { error, handleError, clearError }
}

