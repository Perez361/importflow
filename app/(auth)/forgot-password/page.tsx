import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamically import the form component with SSR disabled to prevent prerender errors
const ForgotPasswordForm = dynamic(
  () => import('./ForgotPasswordForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
