'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, CreditCard, Star, AlertCircle, ArrowRight } from 'lucide-react'

const mockSubscriptions = [
  {
    id: '1',
    companion: {
      id: '1',
      displayName: 'Kavignar Selvi',
      avatarUrl: '',
    },
    plan: { label: '4 sessions/month', sessionsPerMonth: 4 },
    status: 'active',
    sessionsUsed: 2,
    currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-primary">மொழி</span>
            <span className="text-xl font-serif font-semibold text-foreground">Mozhi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link href="/sessions" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sessions</Link>
            <Link href="/subscriptions" className="text-sm font-medium text-primary">Subscriptions</Link>
          </nav>
          <Button variant="ghost" asChild><Link href="/login">Sign out</Link></Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Subscriptions</h1>
            <p className="text-muted-foreground">Manage your active companion subscriptions.</p>
          </div>
          <Button asChild><Link href="/companions">Find More Companions</Link></Button>
        </div>

        {mockSubscriptions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockSubscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardHeader className="flex flex-row items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={sub.companion.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {sub.companion.displayName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle>{sub.companion.displayName}</CardTitle>
                    <CardDescription>{sub.plan.label}</CardDescription>
                  </div>
                  <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>{sub.status}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sessions used</span>
                      <span className="font-medium">{sub.sessionsUsed}/{sub.plan.sessionsPerMonth}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(sub.sessionsUsed / sub.plan.sessionsPerMonth) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Renews
                      </span>
                      <span className="font-medium">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
              <p className="text-muted-foreground mb-4">Subscribe to a companion to book sessions.</p>
              <Button asChild><Link href="/companions">Browse Companions</Link></Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}