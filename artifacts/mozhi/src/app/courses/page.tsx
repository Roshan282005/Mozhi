

import { useState, useEffect, Suspense } from 'react'
import { Link } from 'wouter'
import { useSearchParams } from '@/lib/navigation'
import { supabase } from '@/lib/supabase/client'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  Clock, 
  BookOpen,
  PlayCircle,
  Award
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  is_free: boolean
  level: string
  total_enrolled: number
  avg_rating: number | null
  total_reviews: number
  duration: number | null
  category: { name: string; slug: string } | null
  teacher: { full_name: string; avatar_url: string | null } | null
}

interface Category {
  id: string
  name: string
  slug: string
}

function CoursesContent() {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [selectedCategory, selectedLevel, page])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (data) setCategories(data)
  }

  const fetchCourses = async () => {
    setLoading(true)
    let query = supabase
      .from('courses')
      .select(`
        *,
        category:categories(name, slug),
        teacher:users(full_name, avatar_url)
      `)
      .eq('status', 'PUBLISHED')

    if (selectedCategory !== 'all') {
      query = query.eq('category.slug', selectedCategory)
    }

    if (selectedLevel !== 'all') {
      query = query.eq('level', selectedLevel)
    }

    const from = (page - 1) * 12
    const to = from + 11

    const { data, count } = await query
      .range(from, to)
      .order('total_enrolled', { ascending: false })

    if (data) {
      setCourses(data)
      setTotalPages(Math.ceil((count || 0) / 12))
    }
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.length >= 2) {
      fetchCourses() // In production, use API search endpoint
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Learn Without Limits</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover thousands of courses taught by expert instructors. Start learning today.
              </p>
              
              <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search courses..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </div>
          </div>
        </section>

        {/* Filters & Course Grid */}
        <section className="py-8">
          <div className="container">
            <div className="flex flex-wrap gap-4 mb-8">
              <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={(val) => setSelectedLevel(val || 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <Link key={course.id} href={`/courses/${course.slug}`}>
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video relative bg-muted">
                        {course.thumbnail ? (
                          <img 
                            src={course.thumbnail} 
                            alt={course.title}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-primary/5">
                            <PlayCircle className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                        {course.is_free && (
                          <Badge className="absolute top-2 left-2 bg-green-500">
                            FREE
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {course.category?.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {course.level}
                          </Badge>
                        </div>
                        <h3 className="font-semibold line-clamp-2 mb-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {course.total_enrolled}
                          </div>
                          {course.avg_rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {course.avg_rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between items-center">
                        <span className="font-semibold">
                          {course.is_free ? 'Free' : `₹${course.price}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.teacher?.full_name}
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    }>
      <CoursesContent />
    </Suspense>
  )
}