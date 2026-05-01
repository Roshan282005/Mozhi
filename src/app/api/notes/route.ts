import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const lessonId = searchParams.get('lessonId')
    const courseId = searchParams.get('courseId')

    let query = supabase
      .from('notes')
      .select(`
        *,
        lesson:lessons!inner(id, title, section:sections!inner(id, course_id))
      `)

    if (userId) query = query.eq('user_id', userId)
    if (lessonId) query = query.eq('lesson_id', lessonId)
    if (courseId) query = query.eq('lessons.sections.course_id', courseId)

    const { data, error } = await query.order('timestamp', { ascending: true })

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
    const { userId, lessonId, timestamp, content } = body

    if (!userId || !lessonId || !content) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: userId, lesson_id: lessonId, timestamp, content })
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, timestamp, content } = body

    if (!noteId || !content) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('notes')
      .update({ timestamp, content })
      .eq('id', noteId)
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
    const noteId = searchParams.get('noteId')
    const userId = searchParams.get('userId')
    const lessonId = searchParams.get('lessonId')

    if (noteId) {
      const { error } = await supabase.from('notes').delete().eq('id', noteId)
      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (userId && lessonId) {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: { message: 'Missing parameters' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}