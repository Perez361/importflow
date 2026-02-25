import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Truck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Globe,
} from 'lucide-react'

const CediIcon = ({ className }: { className?: string }) => {
  return (
    <span className={`font-extrabold text-xl ${className}`}>
      ₵
    </span>
  );
};

const features = [
  {
    icon: Package,
    title: 'Product Management',
    description: 'Easily manage your inventory with real-time stock tracking and low stock alerts.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: ShoppingCart,
    title: 'Order Processing',
    description: 'Streamline your sales process from order creation to delivery tracking.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Truck,
    title: 'Shipment Tracking',
    description: 'Track your import shipments from origin to destination with detailed status updates.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: CediIcon,
    title: 'Profit Analytics',
    description: 'Understand your business performance with detailed cost and revenue tracking.',
    color: 'from-green-500 to-emerald-500',
  },
]

const plans = [
  {
    name: 'Free Trial',
    price: 'Free',
    description: 'Perfect for trying out ImportFlow before committing',
    features: ['Up to 25 products', '1 staff member', 'Basic analytics', 'Email support', 'Standard storefront'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '₵99',
    period: '/month',
    description: 'Perfect for small businesses just getting started',
    features: ['Up to 100 products', '2 staff members', 'Basic analytics', 'Email support', 'Standard storefront'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '₵299',
    period: '/month',
    description: 'For growing businesses that need more power',
    features: ['Up to 500 products', '5 staff members', 'Advanced analytics', 'Priority support', 'Custom storefront', 'API access'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '₵599',
    period: '/month',
    description: 'For large operations with advanced needs',
    features: ['Unlimited products', 'Unlimited staff', 'Full analytics suite', '24/7 priority support', 'API access', 'Custom integrations', 'Dedicated account manager'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const benefits = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed and performance',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security for your data',
  },
  {
    icon: Globe,
    title: 'Access Anywhere',
    description: 'Works on any device, anywhere',
  },
  {
    icon: Sparkles,
    title: 'Always Updated',
    description: 'New features added regularly',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">
                ImportFlow
              </span>
              <span className="badge-primary text-xs">
                PRO
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="link-muted text-sm">
                Features
              </Link>
              <Link href="#pricing" className="link-muted text-sm">
                Pricing
              </Link>
              <Link href="#contact" className="link-muted text-sm">
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="btn btn-ghost btn-sm"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn btn-primary btn-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in-down">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Trusted by 500+ importers across Africa
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-tight animate-fade-in-up text-balance">
              Manage Your Importation Business
              <span className="block text-gradient mt-2">
                Like a Pro
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              ImportFlow PRO helps importers in Ghana and across Africa manage products, 
              track shipments, process orders, and grow their business with powerful yet simple tools.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Link
                href="/register"
                className="btn btn-primary btn-xl w-full sm:w-auto group"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="btn btn-outline btn-xl w-full sm:w-auto"
              >
                Learn More
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground animate-fade-in animation-delay-500">
              14-day free trial • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="py-8 border-y border-border bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <span className="badge badge-primary mb-4">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed specifically for importation businesses
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-interactive p-6 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-16">
            <span className="badge badge-primary mb-4">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Get started in minutes, not days
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simple setup process to get you up and running quickly
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Create Your Account',
                description: 'Sign up and set up your business profile in minutes.',
                icon: Sparkles,
              },
              {
                step: '2',
                title: 'Add Your Products',
                description: 'Import your inventory or add products manually.',
                icon: Package,
              },
              {
                step: '3',
                title: 'Start Selling',
                description: 'Share your storefront link and start receiving orders.',
                icon: ShoppingCart,
              },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center group">
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <span className="badge badge-primary mb-4">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that fits your business
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl scale-105 z-10'
                    : 'card-hover'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge bg-yellow-400 text-yellow-900 border-0">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <h3 className={`text-lg font-semibold ${plan.highlighted ? 'text-white/90' : 'text-foreground'}`}>
                  {plan.name}
                </h3>
                
                <div className="mt-4 flex items-baseline">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`ml-1 ${plan.highlighted ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                
                <p className={`mt-2 text-sm ${plan.highlighted ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className={`h-5 w-5 ${plan.highlighted ? 'text-white/80' : 'text-primary'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-white' : 'text-muted-foreground'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/register"
                  className={`mt-8 w-full btn ${
                    plan.highlighted
                      ? 'bg-white text-primary hover:bg-white/90'
                      : 'btn-primary'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-cyan-600 p-12 text-center text-white">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-balance">
                Ready to Transform Your Importation Business?
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
                Join hundreds of importers who are already using ImportFlow PRO to grow their business.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl group"
              >
                Start Your Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  ImportFlow
                </span>
                <span className="badge-primary text-xs">
                  PRO
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm">
                Empowering importers across Africa with powerful tools to manage their business efficiently.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="link-muted text-sm">Features</Link></li>
                <li><Link href="#pricing" className="link-muted text-sm">Pricing</Link></li>
                <li><Link href="#" className="link-muted text-sm">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/terms" className="link-muted text-sm">Terms</Link></li>
                <li><Link href="/privacy" className="link-muted text-sm">Privacy</Link></li>
                <li><Link href="/contact" className="link-muted text-sm">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="divider mt-8" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ImportFlow PRO. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="link-muted text-sm">Terms</Link>
              <Link href="/privacy" className="link-muted text-sm">Privacy</Link>
              <Link href="/contact" className="link-muted text-sm">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
