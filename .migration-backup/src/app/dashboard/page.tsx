'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  TrendingUp,
  Target,
  Flame,
  Bell,
  Search,
  Calendar,
  ChevronRight,
  CheckCircle,
  Lock
} from 'lucide-react'

interface Enrollment {
  id: string
  progress: Record<string, any>
  enrolled_at: string
  course: {
    id: string
    title: string
    slug: string
    thumbnail: string | null
    avg_rating: number | null
  }
}

interface Certificate {
  id: string
  course: {
    id: string
    title: string
    slug: string
  }
  issued_at: string
}

interface Notification {
  id: string
  title: string
  message: string | null
  read: boolean
  created_at: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)

    const { data: enrollmentData } = await supabase
      .from('enrollments')
      .select(`
        id, progress, enrolled_at,
        course:courses(id, title, slug, thumbnail, avg_rating)
      `)
      .eq('user_id', user?.id)
      .eq('status', 'ACTIVE')
      .order('enrolled_at', { ascending: false })
      .limit(5)

    if (enrollmentData) setEnrollments(enrollmentData as Enrollment[])

    const { data: certificateData } = await supabase
      .from('certificates')
      .select(`
        id, issued_at,
        course:courses(id, title, slug)
      `)
      .eq('user_id', user?.id)
      .order('issued_at', { ascending: false })
      .limit(3)

    if (certificateData) setCertificates(certificateData as Certificate[])

    const { data: notificationData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (notificationData) setNotifications(notificationData as Notification[])

    setLoading(false)
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const getCourseProgress = (progress: Record<string, any>, totalLessons: number = 0) => {
    if (!progress || Object.keys(progress).length === 0) return 0
    const completed = Object.keys(progress).filter(k => progress[k]?.completed).length
    return totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-8">
          <div className="container">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user.fullName?.split(' ')[0]}!
                </h1>
                <p className="text-muted-foreground">
                  Continue your learning journey. You have {user.streak || 0} day streak!
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold">{user.streak || 0} day streak</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{user.xp || 0} XP</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container">
            {/* Continue Learning */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Continue Learning</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start learning by enrolling in a course
                    </p>
                    <Button asChild>
                      <Link href="/courses">Browse Courses</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-muted relative">
                        {enrollment.course.thumbnail ? (
                          <img 
                            src={enrollment.course.thumbnail} 
                            alt={enrollment.course.title}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-primary/5">
                            <Play className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">
                            {getCourseProgress(enrollment.progress)}% complete
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-1 mb-2">
                          {enrollment.course.title}
                        </h3>
                        <Button className="w-full" asChild>
                          <Link href={`/courses/${enrollment.course.slug}`}>
                            Continue Learning
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* My Certificates */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>My Certificates</CardTitle>
                      <CardDescription>Earned certificates</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/certificates">View All</Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-24" />
                    ) : certificates.length === 0 ? (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Complete courses to earn certificates
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {certificates.map((cert) => (
                          <div 
                            key={cert.id}
                            className="flex items-center gap-4 p-4 rounded-lg border"
                          >
                            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                              <Award className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{cert.course.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Earned {new Date(cert.issued_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/certificates/${cert.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notifications */}
              <div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Notifications</CardTitle>
                    <Button variant="ghost" size="sm">
                      Mark all read
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-32" />
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-4">
                        <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notifications.slice(0, 5).map((notif) => (
                          <div 
                            key={notif.id}
                            className={`p-3 rounded-lg ${
                              notif.read ? 'bg-muted/50' : 'bg-primary/5 border-l-2 border-l-primary'
                            }`}
                          >
                            <p className="text-sm font-medium">{notif.title}</p>
                            {notif.message && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {notif.message.substring(0, 50)}...
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                  <Link href="/courses">
                    <Search className="h-6 w-6" />
                    <span>Explore Courses</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                  <Link href="/settings">
                    <Target className="h-6 w-6" />
                    <span>Learning Goals</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                  <Link href="/subscriptions">
                    <Award className="h-6 w-6" />
                    <span>Upgrade Plan</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" asChild>
                  <Link href="/settings">
                    <Bell className="h-6 w-6" />
                    <span>Notifications</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}