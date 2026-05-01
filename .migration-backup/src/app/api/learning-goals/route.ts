import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const goalId = searchParams.get('goalId')

    if (goalId) {
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('id', goalId)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    let query = supabase
      .from('learning_goals')
      .select(`
        *,
        course:courses(id, title, slug, thumbnail)
      `)

    if (userId) query = query.eq('user_id', userId)
    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query.order('target_date', { ascending: true })

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
    const { userId, courseId, title, description, targetDate, targetLessons } = body

    if (!userId || !courseId || !title) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('learning_goals')
      .insert({
        user_id: userId,
        course_id: courseId,
        title,
        description,
        target_date: targetDate,
        target_lessons: targetLessons
      })
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
    const { goalId, completed, completedAt } = body

    if (!goalId) {
      return NextResponse.json({ success: false, error: { message: 'goalId required' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('learning_goals')
      .update({
        completed,
        completed_at: completedAt || (completed ? new Date().toISOString() : null)
      })
      .eq('id', goalId)
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
    const goalId = searchParams.get('goalId')

    if (!goalId) {
      return NextResponse.json({ success: false, error: { message: 'goalId required' } }, { status: 400 })
    }

    const { error } = await supabase.from('learning_goals').delete().eq('id', goalId)

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}