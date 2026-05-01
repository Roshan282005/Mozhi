import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const sessionId = searchParams.get('sessionId')
    const upcoming = searchParams.get('upcoming') === 'true'

    if (sessionId) {
      const { data, error } = await supabase
        .from('live_sessions')
        .select(`
          *,
          lesson:lessons(id, title, section:sections!inner(course_id, title))
        `)
        .eq('id', sessionId)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    let query = supabase
      .from('live_sessions')
      .select(`
        *,
        lesson:lessons(id, title, section:sections!inner(course_id, title, course:courses(id, title, slug))
      `)

    if (lessonId) query = query.eq('lesson_id', lessonId)
    if (upcoming) query = query.gte('scheduled_at', new Date().toISOString()).eq('status', 'scheduled')

    const { data, error } = await query.order('scheduled_at', { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacherId, lessonId, title, scheduledAt, durationMins, maxParticipants } = body

    if (!lessonId || !title || !scheduledAt) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data: existingSession } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('lesson_id', lessonId)
      .single()

    if (existingSession) {
      const { data, error } = await supabase
        .from('live_sessions')
        .update({
          title,
          scheduled_at: scheduledAt,
          duration_mins: durationMins || 60,
          max_participants: maxParticipants || 100,
          status: 'scheduled'
        })
        .eq('id', existingSession.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    const { data, error } = await supabase
      .from('live_sessions')
      .insert({
        lesson_id: lessonId,
        title,
        scheduled_at: scheduledAt,
        duration_mins: durationMins || 60,
        max_participants: maxParticipants || 100
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    const { data: lesson } = await supabase
      .from('lessons')
      .select('section:sections(course_id)')
      .eq('id', lessonId)
      .single()

    const sectionData = lesson?.section as any
    const courseId = sectionData?.course_id
    const { data: enrollments } = courseId ? await supabase
      .from('enrollments')
      .select('user_id')
      .eq('course_id', courseId)
      .eq('status', 'ACTIVE') : { data: [] }

    if (enrollments && enrollments.length > 0) {
      const notifications = enrollments.map(e => ({
        user_id: e.user_id,
        type: 'LIVE_SESSION',
        title: 'New live session scheduled',
        message: `A live session "${title}" has been scheduled`,
        link: `/courses/*/lessons/${lessonId}?live=true`
      }))

      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, status, joinUrl, recordingUrl } = body

    if (!sessionId) {
      return NextResponse.json({ success: false, error: { message: 'sessionId required' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('live_sessions')
      .update({ status, join_url: joinUrl, recording_url: recordingUrl })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ success: false, error: { message: 'sessionId required' } }, { status: 400 })
    }

    const { error } = await supabase
      .from('live_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}