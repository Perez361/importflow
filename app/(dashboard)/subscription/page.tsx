'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Check, Zap, Crown, Building2 } from 'lucide-react'
import type { Importer } from '@/types/database'

const plans = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    period: 'forever',
    description: 'Perfect for trying out ImportFlow',
    features: [
      'Up to 10 products',
      'Up to 50 customers',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    description: 'For small import businesses',
    features: [
      'Up to 100 products',
      'Up to 500 customers',
      'Order management',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Upgrade',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 79,
    period: 'month',
    description: 'For growing import businesses',
    features: [
      'Unlimited products',
      'Unlimited customers',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom domain',
    ],
    cta: 'Upgrade',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'White-label option',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function SubscriptionPage() {
  const [importer, setImporter] = useState<Importer | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    async function loadImporter() {
      if (!user?.profile?.importer_id) return
      
      const result = await supabase
        .from('importers')
        .select('*')
        .eq('id', user.profile.importer_id)
        .single()
      
      if (result.data) {
        setImporter(result.data as Importer)
      }
      setLoading(false)
    }

    loadImporter()
  }, [user])

  const currentPlan = plans.find(p => p.id === (importer?.subscription_status || 'free')) || plans[0]

  if (!user?.auth) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription plan</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          {/* Current Plan */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <h2 className="text-xl font-bold mt-1">{currentPlan.name}</h2>
                <p className="text-muted-foreground mt-1">
                  {importer?.subscription_status === 'trial' 
                    ? `Trial ends ${importer?.trial_ends_at ? new Date(importer.trial_ends_at).toLocaleDateString() : 'soon'}`
                    : `$${currentPlan.price}/${currentPlan.period}`
                  }
                </p>
              </div>
              <span className="badge badge-primary">Active</span>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`card p-6 relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-primary">Most Popular</span>
                  </div>
                )}
                
                <div className="mb-4">
                  {plan.id === 'enterprise' ? (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  ) : plan.id === 'pro' ? (
                    <Zap className="h-6 w-6 text-primary" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  className={`btn w-full ${plan.id === currentPlan.id ? 'btn-outline' : 'btn-primary'}`}
                  disabled={plan.id === currentPlan.id}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
