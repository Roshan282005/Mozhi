

import { useState, useEffect } from 'react'
import { useRouter } from '@/lib/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { 
  Users, 
  DollarSign, 
  BookOpen, 
  TrendingUp,
  BarChart3,
  Settings,
  Shield,
  Search,
  MoreVertical,
  Check,
  X,
  Edit
} from 'lucide-react'

interface Stats {
  overview: {
    totalUsers: number
    totalCourses: number
    totalEnrollments: number
    monthlyRevenue: number
  }
  subscriptions: { FREE: number; PRO: number; PLUS: number }
  topCourses: Array<{ id: string; title: string; total_enrolled: number; avg_rating: number | null }>
  topInstructors: Array<{ id: string; full_name: string; avatar_url: string | null }>
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  subscription_tier: string
  created_at: string
}

interface Course {
  id: string
  title: string
  slug: string
  status: string
  teacher: { full_name: string } | null | any
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchAdminData()
    }
  }, [user])

  const fetchAdminData = async () => {
    setLoading(true)

    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email, role, subscription_tier, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (usersData) setUsers(usersData)

    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title, slug, status, teacher:users(full_name)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (coursesData) setCourses(coursesData)

    const [{ data: totalUsers }, { data: totalCourses }, { data: totalEnrollments }] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('enrollments').select('id', { count: 'exact', head: true })
    ])

    const { data: subsData } = await supabase
      .from('platform_subscriptions')
      .select('tier')
      .eq('status', 'ACTIVE')

    const tierDist = { FREE: 0, PRO: 0, PLUS: 0 }
    subsData?.forEach(s => {
      if (s.tier in tierDist) tierDist[s.tier as keyof typeof tierDist]++
    })

    const { data: topCoursesData } = await supabase
      .from('courses')
      .select('id, title, total_enrolled, avg_rating')
      .eq('status', 'PUBLISHED')
      .order('total_enrolled', { ascending: false })
      .limit(5)

    const { data: topInstructors } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('role', 'TEACHER')
      .limit(5)

    setStats({
      overview: {
        totalUsers: totalUsers?.length || 0,
        totalCourses: totalCourses?.length || 0,
        totalEnrollments: totalEnrollments?.length || 0,
        monthlyRevenue: 0
      },
      subscriptions: tierDist,
      topCourses: topCoursesData || [],
      topInstructors: topInstructors || []
    })

    setLoading(false)
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    await supabase
      .from('users')
      .update({ role: newRole as any })
      .eq('id', userId)

    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  const updateCourseStatus = async (courseId: string, newStatus: string) => {
    await supabase
      .from('courses')
      .update({ status: newStatus as any })
      .eq('id', courseId)

    setCourses(courses.map(c => c.id === courseId ? { ...c, status: newStatus } : c))
  }

  if (authLoading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Panel</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <span className="text-sm">{user.fullName}</span>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : stats && (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalCourses}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalEnrollments}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{stats.overview.monthlyRevenue.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.topCourses.map((course, i) => (
                          <div key={course.id} className="flex items-center gap-3">
                            <span className="text-lg font-bold text-muted-foreground w-6">
                              {i + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium">{course.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {course.total_enrolled} students
                              </p>
                            </div>
                            {course.avg_rating && (
                              <Badge variant="outline">{course.avg_rating} ★</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Free</span>
                          <Badge variant="outline">{stats.subscriptions.FREE}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Pro</span>
                          <Badge>{stats.subscriptions.PRO}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Plus</span>
                          <Badge variant="secondary">{stats.subscriptions.PLUS}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage all users</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'TEACHER' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                        {user.role === 'STUDENT' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateUserRole(user.id, 'TEACHER')}
                          >
                            Make Teacher
                          </Button>
                        )}
                        {user.role === 'TEACHER' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateUserRole(user.id, 'ADMIN')}
                          >
                            Make Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Course Approvals</CardTitle>
                <CardDescription>Review and manage courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">
                          By {course.teacher?.full_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          course.status === 'PUBLISHED' ? 'default' :
                          course.status === 'REVIEW' ? 'secondary' : 'outline'
                        }>
                          {course.status}
                        </Badge>
                        {course.status === 'REVIEW' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateCourseStatus(course.id, 'PUBLISHED')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateCourseStatus(course.id, 'DRAFT')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Settings panel coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}