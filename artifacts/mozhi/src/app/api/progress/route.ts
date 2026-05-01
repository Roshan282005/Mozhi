import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: { message: 'userId and courseId required' } }, { status: 400 })
    }

    const { data: lessons } = await supabase
      .from('lessons')
      .select(`
        id,
        section:sections!inner(id, course_id)
      `)
      .eq('sections.course_id', courseId)

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({ success: true, data: { completed: [], total: 0, percentage: 0 } })
    }

    const lessonIds = lessons.map((l: any) => l.id)

    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    const completedLessonIds = progress?.map((p) => p.lesson_id) || []
    const totalLessons = lessons.length
    const completedCount = completedLessonIds.length
    const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        completed: completedLessonIds,
        total: totalLessons,
        percentage,
        progress: progress || []
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, lessonId, watchTime, completed } = body

    if (!userId || !lessonId) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data: existingProgress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    let data
    if (existingProgress) {
      const { data: updated, error } = await supabase
        .from('progress')
        .update({
          watch_time: watchTime || existingProgress.watch_time,
          completed_at: completed ? new Date().toISOString() : existingProgress.completed_at
        })
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      data = updated
    } else {
      const { data: created, error } = await supabase
        .from('progress')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          watch_time: watchTime || 0,
          completed_at: completed ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      data = created
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}