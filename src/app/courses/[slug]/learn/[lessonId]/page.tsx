'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth'
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Settings,
  CheckCircle,
  Lock,
  BookOpen,
  FileText,
  MessageSquare,
  Lightbulb,
  Menu,
  X
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  type: string
  description: string | null
  video_url: string | null
  duration: number
  is_free: boolean
}

interface Section {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  slug: string
  sections: Section[]
}

export default function CoursePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const lessonId = params.lessonId as string
  const { user } = useAuthStore()
  
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetchCourseContent()
  }, [slug, lessonId])

  const fetchCourseContent = async () => {
    setLoading(true)
    
    const { data: courseData } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('slug', slug)
      .single()

    if (!courseData) {
      router.push('/courses')
      return
    }

    const { data: sectionsData } = await supabase
      .from('sections')
      .select(`
        id, title, order,
        lessons(id, title, type, description, video_url, duration, is_free, order)
      `)
      .eq('course_id', courseData.id)
      .order('order')

    if (sectionsData) {
      sectionsData.forEach((section: any) => {
        section.lessons?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      })
      sectionsData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    }

    let lesson: Lesson | null = null
    if (lessonId) {
      for (const section of sectionsData || []) {
        const found = section.lessons?.find((l: Lesson) => l.id === lessonId)
        if (found) {
          lesson = found
          break
        }
      }
    } else {
      lesson = sectionsData?.[0]?.lessons?.[0] || null
    }

    setCourse({ ...courseData, sections: sectionsData || [] })
    setCurrentLesson(lesson)
    setLoading(false)
  }

  const markComplete = async () => {
    if (!user || !currentLesson) return

    const { data: existing } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', currentLesson.id)
      .single()

    if (!existing) {
      await supabase.from('progress').insert({
        user_id: user.id,
        lesson_id: currentLesson.id,
        completed_at: new Date().toISOString(),
        watch_time: progress
      })
    }
  }

  const getAllLessons = () => {
    if (!course?.sections) return []
    return course.sections.flatMap(s => s.lessons || [])
  }

  const getCurrentIndex = () => {
    const lessons = getAllLessons()
    return lessons.findIndex(l => l.id === currentLesson?.id)
  }

  const goToLesson = (lesson: Lesson) => {
    router.push(`/courses/${slug}/learn/${lesson.id}`)
    setCurrentLesson(lesson)
  }

  const nextLesson = () => {
    const lessons = getAllLessons()
    const idx = getCurrentIndex()
    if (idx < lessons.length - 1) {
      goToLesson(lessons[idx + 1])
    }
  }

  const prevLesson = () => {
    const lessons = getAllLessons()
    const idx = getCurrentIndex()
    if (idx > 0) {
      goToLesson(lessons[idx - 1])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-4xl" />
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Lesson not found</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Video Player Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-background">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push(`/courses/${slug}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
          
          <h1 className="font-medium text-sm truncate hidden md:block">
            {course.title}
          </h1>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </header>

        {/* Video Player */}
        <div className="flex-1 bg-black relative">
          {currentLesson.video_url ? (
            <>
              <div className="aspect-video bg-black flex items-center justify-center">
                <video
                  src={currentLesson.video_url}
                  className="w-full h-full object-contain"
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={markComplete}
                  onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
                />
              </div>
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="range" 
                    className="flex-1" 
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white"
                      onClick={prevLesson}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white"
                      onClick={() => playing ? setPlaying(false) : setPlaying(true)}
                    >
                      {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white"
                      onClick={nextLesson}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white"
                      onClick={() => setMuted(!muted)}
                    >
                      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <span className="text-white text-sm">
                      {currentLesson.duration} mins
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white"
                      onClick={markComplete}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white">
                      <Settings className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white">
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No video available for this lesson</p>
                <p className="text-sm opacity-70">Content: {currentLesson.title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Info Tabs */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="qa">Q&A</TabsTrigger>
              <TabsTrigger value="ai">AI Helper</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-4">
              <h2 className="text-xl font-bold mb-2">{currentLesson.title}</h2>
              <p className="text-muted-foreground">{currentLesson.description}</p>
            </TabsContent>

            <TabsContent value="resources" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lesson Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No resources available</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea 
                    className="w-full h-32 p-2 border rounded"
                    placeholder="Take notes for this lesson..."
                  />
                  <Button className="mt-2">Save Note</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qa" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Questions & Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea 
                    className="w-full h-24 p-2 border rounded mb-2"
                    placeholder="Ask a question..."
                  />
                  <Button>Post Question</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI Study Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-auto mb-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Ask me anything about this lesson!</p>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 p-2 border rounded"
                      placeholder="Ask a question..."
                    />
                    <Button>Ask AI</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sidebar - Course Content */}
      {sidebarOpen && (
        <div className="w-80 border-l bg-background overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Course Content</h2>
          </div>
          <ScrollArea className="flex-1">
            {course.sections.map((section) => (
              <div key={section.id}>
                <div className="p-3 bg-muted/50 font-medium text-sm">
                  {section.title}
                </div>
                {section.lessons?.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => goToLesson(lesson)}
                    className={`w-full p-3 flex items-center gap-2 text-left border-b hover:bg-muted/50 ${
                      lesson.id === currentLesson.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    {lesson.id === currentLesson.id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : lesson.type === 'VIDEO' ? (
                      <Play className="h-4 w-4" />
                    ) : lesson.type === 'QUIZ' ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                    <span className="text-sm flex-1 truncate">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {lesson.duration}m
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}