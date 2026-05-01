

import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { useRouter } from '@/lib/navigation'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { 
  Plus, 
  Users, 
  DollarSign, 
  Star, 
  TrendingUp,
  BookOpen,
  Play,
  Settings,
  BarChart3,
  FileText,
  Calendar,
  ChevronRight
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  thumbnail: string | null
  status: string
  total_enrolled: number
  avg_rating: number | null
  price: number
  is_free: boolean
}

interface Stats {
  totalStudents: number
  totalRevenue: number
  avgRating: number
  totalCourses: number
}

export default function TeacherDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0,
    totalCourses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'TEACHER')) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'TEACHER') {
      fetchTeacherData()
    }
  }, [user])

  const fetchTeacherData = async () => {
    setLoading(true)

    const { data: courseData } = await supabase
      .from('courses')
      .select('id, title, slug, thumbnail, status, total_enrolled, avg_rating, price, is_free')
      .eq('teacher_id', user?.id)
      .order('created_at', { ascending: false })

    if (courseData) setCourses(courseData)

    const totalStudents = courseData?.reduce((acc, c) => acc + c.total_enrolled, 0) || 0
    const totalRevenue = courseData?.reduce((acc, c) => {
      return acc + (c.is_free ? 0 : c.price * c.total_enrolled)
    }, 0) || 0
    const ratings = courseData?.filter(c => c.avg_rating).map(c => c.avg_rating) || []
    const avgRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0

    setStats({
      totalStudents,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10,
      totalCourses: courseData?.length || 0
    })

    setLoading(false)
  }

  if (authLoading || !user || user.role !== 'TEACHER') {
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
        <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-8">
          <div className="container">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Instructor Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your courses and track performance
                </p>
              </div>
              <Button asChild>
                <Link href="/teacher/courses/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container">
            <Tabs defaultValue="overview">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">My Courses</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.avgRating || 'N/A'}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalCourses}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-32" />
                    ) : courses.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No courses yet</p>
                        <Button asChild>
                          <Link href="/teacher/courses/new">Create Your First Course</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {courses.slice(0, 5).map((course) => (
                          <div 
                            key={course.id}
                            className="flex items-center gap-4 p-4 rounded-lg border"
                          >
                            <div className="h-16 w-24 rounded bg-muted overflow-hidden">
                              {course.thumbnail ? (
                                <img 
                                  src={course.thumbnail} 
                                  alt={course.title}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full bg-primary/5">
                                  <Play className="h-6 w-6 text-primary/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{course.title}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{course.total_enrolled} students</span>
                                {course.avg_rating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {course.avg_rating}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                              {course.status}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/teacher/courses/${course.slug}/edit`}>
                                Edit
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="courses">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Courses</CardTitle>
                    <Button size="sm" asChild>
                      <Link href="/teacher/courses/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Course
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div 
                          key={course.id}
                          className="flex items-center gap-4 p-4 rounded-lg border"
                        >
                          <div className="h-16 w-24 rounded bg-muted overflow-hidden">
                            {course.thumbnail && (
                              <img 
                                src={course.thumbnail} 
                                alt={course.title}
                                className="object-cover w-full h-full"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{course.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {course.total_enrolled} students · 
                              {course.is_free ? ' Free' : ` ₹${course.price}`}
                            </p>
                          </div>
                          <Badge variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                            {course.status}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teacher/courses/${course.slug}/edit`}>
                              Manage
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>Track your course performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Detailed analytics coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payouts">
                <Card>
                  <CardHeader>
                    <CardTitle>Payouts</CardTitle>
                    <CardDescription>Track your earnings and withdrawals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Set up your payout method to receive earnings
                      </p>
                      <Button>Setup Payouts</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}