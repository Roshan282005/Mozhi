'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { 
  PlayCircle, 
  Clock, 
  Users, 
  Star, 
  BookOpen,
  CheckCircle,
  Lock,
  Heart,
  Share2,
  Award,
  Globe,
  Headphones,
  FileText,
  Download
} from 'lucide-react'

interface Section {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  type: string
  duration: number
  is_free: boolean
  order: number
}

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  is_free: boolean
  level: string
  language: string
  total_enrolled: number
  avg_rating: number | null
  total_reviews: number
  duration: number | null
  requirements: string | null
  outcomes: string | null
  category: { name: string; slug: string } | null
  teacher: { id: string; full_name: string; avatar_url: string | null; bio: string | null } | null
  sections: Section[]
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { user } = useAuthStore()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchCourseDetails()
  }, [slug])

  const fetchCourseDetails = async () => {
    setLoading(true)
    
    const { data: courseData, error } = await supabase
      .from('courses')
      .select(`
        *,
        category:categories(name, slug),
        teacher:users(id, full_name, avatar_url, bio)
      `)
      .eq('slug', slug)
      .single()

    if (error || !courseData) {
      router.push('/courses')
      return
    }

    const { data: sectionsData } = await supabase
      .from('sections')
      .select(`
        id, title, order,
        lessons(id, title, type, duration, is_free, order)
      `)
      .eq('course_id', courseData.id)
      .order('order')

    if (sectionsData) {
      sectionsData.forEach((section: any) => {
        if (section.lessons) {
          section.lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        }
      })
      sectionsData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    }

    setCourse({ ...courseData, sections: sectionsData || [] })

    if (user) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseData.id)
        .single()

      setEnrolled(!!enrollment)

      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseData.id)
        .single()

      setInWishlist(!!wishlist)
    }

    setLoading(false)
  }

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (course?.is_free) {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          status: 'ACTIVE'
        })

      if (!error) {
        setEnrolled(true)
        if (course) router.push(`/learn/${course.slug}`)
      }
    } else {
      if (course) router.push(`/checkout?course=${course.slug}`)
    }
  }

  const toggleWishlist = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (inWishlist) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', course?.id)
    } else {
      await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          course_id: course?.id
        })
    }

    setInWishlist(!inWishlist)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-8">
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!course) return null

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground">
          <div className="container py-12">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary">{course.category?.name}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
                <p className="text-lg opacity-90 mb-6">{course.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.total_enrolled} students
                  </div>
                  {course.avg_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {course.avg_rating.toFixed(1)} ({course.total_reviews} reviews)
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {totalLessons} lessons
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {course.language}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={course.teacher?.avatar_url || undefined} />
                    <AvatarFallback>
                      {course.teacher?.full_name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{course.teacher?.full_name}</p>
                    <p className="text-sm opacity-80">Instructor</p>
                  </div>
                </div>
              </div>

              <div>
                <Card className="bg-white/10 border-0 text-foreground">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-black/30 rounded-lg mb-4 flex items-center justify-center">
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="object-cover w-full h-full rounded-lg"
                        />
                      ) : (
                        <PlayCircle className="h-16 w-16 opacity-50" />
                      )}
                    </div>
                    
                    <div className="text-3xl font-bold mb-4">
                      {course.is_free ? 'Free' : `₹${course.price}`}
                    </div>

                    {enrolled ? (
                      <Button 
                        className="w-full mb-3" 
                        size="lg"
                        onClick={() => router.push(`/learn/${course.slug}`)}
                      >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        className="w-full mb-3" 
                        size="lg"
                        onClick={handleEnroll}
                      >
                        {course.is_free ? 'Enroll Now' : 'Buy Now'}
                      </Button>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={toggleWishlist}
                      >
                        <Heart className={`mr-2 h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                        Wishlist
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </div>

                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Full lifetime access
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Certificate of completion
                      </div>
                      <div className="flex items-center gap-2">
                        <Headphones className="h-4 w-4" />
                        24/7 support
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content Tabs */}
        <section className="py-8">
          <div className="container">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">About this course</h2>
                    <div className="prose max-w-none mb-8">
                      <p>{course.description}</p>
                    </div>

                    {course.requirements && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {course.requirements.split('\n').map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {course.outcomes && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">What you'll learn</h3>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {course.outcomes.split('\n').map((outcome, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                              {outcome}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="curriculum">
                <h2 className="text-2xl font-bold mb-6">Course Content</h2>
                <div className="space-y-4">
                  {course.sections?.map((section, idx) => (
                    <Card key={section.id}>
                      <CardContent className="p-0">
                        <div className="p-4 font-semibold bg-muted/50">
                          Section {idx + 1}: {section.title}
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({section.lessons?.length || 0} lessons)
                          </span>
                        </div>
                        <div>
                          {section.lessons?.map((lesson) => (
                            <div 
                              key={lesson.id}
                              className="p-4 flex items-center justify-between border-t"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.type === 'VIDEO' ? (
                                  <PlayCircle className="h-5 w-5 text-primary" />
                                ) : lesson.type === 'QUIZ' ? (
                                  <FileText className="h-5 w-5 text-primary" />
                                ) : (
                                  <BookOpen className="h-5 w-5 text-primary" />
                                )}
                                <span>{lesson.title}</span>
                                {lesson.is_free && (
                                  <Badge variant="secondary" className="text-xs">Free</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                  {lesson.duration} mins
                                </span>
                                {enrolled || lesson.is_free ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => router.push(`/learn/${course.slug}/${lesson.id}`)}
                                  >
                                    <PlayCircle className="h-4 w-4 mr-1" />
                                    Preview
                                  </Button>
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="instructor">
                <h2 className="text-2xl font-bold mb-6">About the Instructor</h2>
                <div className="flex gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={course.teacher?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {course.teacher?.full_name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{course.teacher?.full_name}</h3>
                    <p className="text-muted-foreground mb-4">Expert Instructor</p>
                    <p>{course.teacher?.bio}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <CourseReviews courseId={course.id} />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function CourseReviews({ courseId }: { courseId: string }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [courseId])

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('course_reviews')
      .select(`
        *,
        user:users(full_name, avatar_url)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setReviews(data)
    setLoading(false)
  }

  if (loading) {
    return <div>Loading reviews...</div>
  }

  if (reviews.length === 0) {
    <div className="text-center py-8">
      <p className="text-muted-foreground">No reviews yet</p>
    </div>
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={review.user?.avatar_url || undefined} />
                <AvatarFallback>
                  {review.user?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{review.user?.full_name}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                </div>
                {review.title && (
                  <h4 className="font-medium mb-1">{review.title}</h4>
                )}
                <p className="text-muted-foreground">{review.body}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}