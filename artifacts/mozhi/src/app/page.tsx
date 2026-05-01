import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Globe2, Video, Languages, ArrowRight, Terminal, ChevronRight } from 'lucide-react'

export default function HomePage() {
  const teachers: Array<{ id: string; display_name: string; city: string; country: string; languages_spoken: string[]; style_tags: string[]; status: string }> = []

  const features = [
    {
      icon: Globe2,
      title: 'Cultural Connection',
      description: 'Connect with Tamil companions who preserve ancient traditions and stories.',
    },
    {
      icon: Video,
      title: 'Live Video Sessions',
      description: 'Intimate video calls to learn, share, and experience Tamil culture directly.',
    },
    {
      icon: Languages,
      title: 'Learn Tamil',
      description: 'From poetry to music, discover the richness of Tamil heritage.',
    },
  ]

  const companions = teachers && teachers.length > 0 ? teachers : [
    {
      id: '1',
      display_name: 'Kavignar Selvi',
      city: 'Chennai',
      country: 'India',
      languages_spoken: ['Tamil', 'English'],
      style_tags: ['Poetry', 'Thirukkural'],
      status: 'APPROVED',
    },
    {
      id: '2',
      display_name: 'Muthusamy Iyer',
      city: 'Madurai',
      country: 'India',
      languages_spoken: ['Tamil', 'English'],
      style_tags: ['Carnatic Music', 'Bhakti'],
      status: 'APPROVED',
    },
    {
      id: '3',
      display_name: 'Meenakshi Ammal',
      city: 'Singapore',
      country: 'Singapore',
      languages_spoken: ['Tamil', 'English'],
      style_tags: ['Storytelling', 'Folk Tales'],
      status: 'APPROVED',
    },
    {
      id: '4',
      display_name: 'Ramaswamy Sir',
      city: 'London',
      country: 'UK',
      languages_spoken: ['Tamil', 'English'],
      style_tags: ['Philosophy', 'Yoga'],
      status: 'APPROVED',
    },
  ]

  const stats = [
    { value: '2,500+', label: 'Live Sessions' },
    { value: '150+', label: 'Tamil Companions' },
    { value: '45+', label: 'Countries' },
    { value: '98%', label: 'Satisfaction' },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <span className="text-lg font-bold text-white">மொ</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Mozhi</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/companions" className="text-sm text-gray-400 hover:text-white transition-colors">
              Companions
            </Link>
            <Link href="/#features" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-gray-400 hover:text-white hover:bg-white/10">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-white text-black hover:bg-gray-200">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-gray-300">Connect with Tamil cultural guides</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Rediscover Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Tamil Heritage
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect with poets, storytellers, and musicians who bring Tamil culture to life through personal video sessions.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" asChild className="h-14 px-8 bg-white text-black hover:bg-gray-200 text-lg">
                <Link href="/companions">
                  Find a Companion
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 border-white/20 text-white hover:bg-white/10 hover:border-white/40 text-lg">
                <Link href="/register?userType=teacher">
                  Become a Companion
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-24 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Culture, Reimagined
              </h2>
              <p className="text-xl text-gray-400 max-w-xl mx-auto">
                Experience the depth of Tamil heritage through personal connections and live conversations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature) => (
                <div key={feature.title} className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-2">
                  Featured Companions
                </h2>
                <p className="text-xl text-gray-400">
                  Learn from authentic Tamil cultural guides
                </p>
              </div>
              <Button variant="outline" asChild className="hidden md:flex border-white/20 text-white hover:bg-white/10 hover:border-white/40">
                <Link href="/companions">
                  View All
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {companions.map((companion) => (
                <Link key={companion.id} href={`/companions/${companion.id}`}>
                  <div className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-105 transition-transform">
                      <span className="text-xl font-bold text-white">
                        {(companion.display_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-center mb-1">{companion.display_name}</h3>
                    <p className="text-sm text-gray-500 text-center mb-3">
                      {companion.city}, {companion.country}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                      {(companion.style_tags || []).slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-white/5 text-gray-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-center pt-3 border-t border-white/10">
                      <span className="text-sm text-gray-500">Available</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8 md:hidden">
              <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                <Link href="/companions">
                  View All Companions
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-indigo-400">Start building connections</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Begin?
              </h2>
              <p className="text-xl text-gray-400 mb-10">
                Join thousands exploring Tamil culture through personal connections. Your heritage awaits.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="h-14 px-8 bg-white text-black hover:bg-gray-200 text-lg">
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-14 px-8 border-white/20 text-white hover:bg-white/10 hover:border-white/40 text-lg">
                  <Link href="/companions">
                    Browse Companions
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <span className="text-sm font-bold text-white">மொ</span>
              </div>
              <span className="text-lg font-semibold">Mozhi</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/gdpr" className="hover:text-white transition-colors">
                GDPR
              </Link>
            </nav>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Mozhi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}