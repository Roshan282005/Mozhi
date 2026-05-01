

import { Link } from 'wouter'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Video, Clock, Calendar, MapPin } from 'lucide-react'

const mockSessions = [
  {
    id: '1',
    companion: {
      id: '1',
      displayName: 'Kavignar Selvi',
      city: 'Chennai',
      country: 'India',
      avatarUrl: '',
    },
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    durationMins: 60,
    status: 'scheduled',
  },
  {
    id: '2',
    companion: {
      id: '2',
      displayName: 'Muthusamy Iyer',
      city: 'Madurai',
      country: 'India',
      avatarUrl: '',
    },
    scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    durationMins: 30,
    status: 'scheduled',
  },
  {
    id: '3',
    companion: {
      id: '3',
      displayName: 'Meenakshi Ammal',
      city: 'Singapore',
      country: 'Singapore',
      avatarUrl: '',
    },
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    durationMins: 45,
    status: 'completed',
    hasReview: true,
  },
  {
    id: '4',
    companion: {
      id: '1',
      displayName: 'Kavignar Selvi',
      city: 'Chennai',
      country: 'India',
      avatarUrl: '',
    },
    scheduledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    durationMins: 60,
    status: 'completed',
    hasReview: false,
  },
  {
    id: '5',
    companion: {
      id: '2',
      displayName: 'Muthusamy Iyer',
      city: 'Madurai',
      country: 'India',
      avatarUrl: '',
    },
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    durationMins: 30,
    status: 'cancelled',
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    case 'no_show':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function SessionsPage() {
  const upcomingSessions = mockSessions.filter(s => s.status === 'scheduled')
  const completedSessions = mockSessions.filter(s => s.status === 'completed')
  const cancelledSessions = mockSessions.filter(s => s.status === 'cancelled')

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const SessionCard = ({ session }: { session: typeof mockSessions[0] }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={session.companion.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {session.companion.displayName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold">{session.companion.displayName}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{session.companion.city}, {session.companion.country}</span>
                </div>
              </div>
              <Badge className={getStatusColor(session.status)}>
                {session.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(session.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{session.durationMins} minutes</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {session.status === 'scheduled' && (
                <>
                  <Button size="sm">
                    <Video className="h-4 w-4 mr-1" />
                    Join Session
                  </Button>
                  <Button size="sm" variant="outline">
                    Reschedule
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive">
                    Cancel
                  </Button>
                </>
              )}
              {session.status === 'completed' && (
                <>
                  {!session.hasReview && (
                    <Button size="sm" variant="outline">
                      Write Review
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Book Again
                  </Button>
                </>
              )}
              {session.status === 'cancelled' && (
                <Button size="sm" variant="outline">
                  Book Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-primary">மொழி</span>
            <span className="text-xl font-serif font-semibold text-foreground">Mozhi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/sessions" className="text-sm font-medium text-primary">
              Sessions
            </Link>
            <Link href="/subscriptions" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Subscriptions
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign out</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">My Sessions</h1>
            <p className="text-muted-foreground">
              Manage your upcoming and past sessions with companions.
            </p>
          </div>
          <Button asChild>
            <Link href="/companions">Find a Companion</Link>
          </Button>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Book a session with a companion to start your cultural journey.
                </p>
                <Button asChild>
                  <Link href="/companions">Browse Companions</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedSessions.length > 0 ? (
              <div className="space-y-4">
                {completedSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No completed sessions yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelledSessions.length > 0 ? (
              <div className="space-y-4">
                {cancelledSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No cancelled sessions.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
