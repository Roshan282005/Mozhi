import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, MapPin, Globe, Calendar, Clock, MessageCircle, Video, Play } from 'lucide-react'

const mockCompanion = {
  id: '1',
  displayName: 'Kavignar Selvi',
  city: 'Chennai',
  country: 'India',
  bio: `Kavignar Selvi is an award-winning Tamil poet with over 20 years of experience in classical and contemporary Tamil literature. Born in the temple city of Thanjavur, she grew up immersed in the rich literary traditions of Tamil Nadu.

Her work has been published in leading Tamil literary journals and she has received the prestigious Kalaimamani award from the Tamil Nadu government. She specializes in Thirukkural interpretations, classical poetry forms like Akam and Puram, and contemporary Tamil literature.

Through Mozhi, she shares her deep knowledge with Tamil diaspora around the world, helping them reconnect with their linguistic and cultural heritage through interactive sessions on poetry, philosophy, and the beauty of Tamil expression.`,
  languagesSpoken: ['Tamil', 'English', 'Sanskrit'],
  styleTags: ['Poetry', 'Thirukkural', 'Literature', 'Philosophy', 'Classical Forms'],
  avgRating: 4.9,
  reviewCount: 47,
  sessionCount: 156,
  memberSince: '2024',
  demoSessionEnabled: true,
  introVideoUrl: '',
  sampleContentUrl: '',
  avatarUrl: '',
  pricingPlans: [
    { id: '1', label: '4 sessions/month', sessionsPerMonth: 4, priceEur: 4 },
    { id: '2', label: '8 sessions/month', sessionsPerMonth: 8, priceEur: 7 },
  ],
  availability: [
    { day: 'Monday', slots: ['10:00', '14:00', '18:00'] },
    { day: 'Wednesday', slots: ['09:00', '15:00'] },
    { day: 'Friday', slots: ['11:00', '16:00', '19:00'] },
    { day: 'Saturday', slots: ['10:00', '12:00', '14:00'] },
  ],
  reviews: [
    {
      id: '1',
      explorerName: 'Priya R.',
      explorerAvatar: '',
      rating: 5,
      body: 'Kavignar Selvi\'s sessions on Thirukkural have been transformative. Her deep knowledge and warm teaching style make every session feel like a journey through Tamil philosophy.',
      date: '2024-03-15',
    },
    {
      id: '2',
      explorerName: 'Arun K.',
      explorerAvatar: '',
      rating: 5,
      body: 'As a second-generation Tamil growing up in Germany, these sessions have helped me reconnect with my roots. Selvi madam explains complex literary concepts in an accessible way.',
      date: '2024-03-10',
    },
    {
      id: '3',
      explorerName: 'Lakshmi M.',
      explorerAvatar: '',
      rating: 5,
      body: 'The attention to detail and genuine passion for Tamil literature is evident in every session. Highly recommend for anyone interested in classical Tamil poetry.',
      date: '2024-03-01',
    },
  ],
}

export default function CompanionProfilePage({ params }: { params: { id: string } }) {
  const companion = mockCompanion

  if (!companion) {
    notFound()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-primary">மொழி</span>
            <span className="text-xl font-serif font-semibold text-foreground">Mozhi</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/companions" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Companions
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={companion.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                  {companion.displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-serif font-bold mb-2">{companion.displayName}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{companion.city}, {companion.country}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span>{companion.languagesSpoken.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Member since {companion.memberSince}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Star className="h-5 w-5 fill-accent text-accent" />
                        <span className="text-2xl font-bold">{companion.avgRating}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{companion.reviewCount} reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{companion.sessionCount}</div>
                      <p className="text-sm text-muted-foreground">sessions</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {companion.styleTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="about">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="availability">Availability</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-neutral dark:prose-invert max-w-none">
                        {companion.bio.split('\n\n').map((paragraph, i) => (
                          <p key={i} className="mb-4 text-muted-foreground">{paragraph}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {companion.introVideoUrl && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="h-5 w-5" />
                          Introduction Video
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <Button variant="outline" size="lg" className="gap-2">
                            <Play className="h-5 w-5" />
                            Play Introduction
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-6 space-y-4">
                  {companion.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.explorerAvatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {review.explorerName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{review.explorerName}</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                                ))}
                              </div>
                            </div>
                            <p className="text-muted-foreground">{review.body}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              {new Date(review.date).toLocaleDateString('en-US', { 
                                year: 'numeric', month: 'long', day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="availability" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Weekly Availability
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {companion.availability.map((day) => (
                          <div key={day.day} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="font-medium">{day.day}</span>
                            <div className="flex flex-wrap gap-1">
                              {day.slots.map((slot) => (
                                <Badge key={slot} variant="outline" className="text-xs">
                                  {slot}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        All times shown in IST (India Standard Time). Sessions are 30 or 60 minutes.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Subscribe to Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companion.pricingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{plan.label}</span>
                        <span className="text-xl font-bold text-primary">€{plan.priceEur}/mo</span>
                      </div>
                      <Button className="w-full" asChild>
                        <Link href={`/register?companion=${companion.id}&plan=${plan.id}`}>
                          Subscribe
                        </Link>
                      </Button>
                    </div>
                  ))}
                  
                  {companion.demoSessionEnabled && (
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Request Demo Session
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Cancel anytime. No commitment required.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-bold text-primary">மொழி</span>
              <span className="text-lg font-serif font-semibold text-foreground">Mozhi</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Mozhi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
