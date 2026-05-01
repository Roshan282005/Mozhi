import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

function generateVerifyHash(): string {
  return Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const verifyHash = searchParams.get('verifyHash')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    let query = supabase
      .from('certificates')
      .select(`
        *,
        user:users(id, full_name, email, avatar_url),
        course:courses(id, title, slug, thumbnail)
      `, { count: 'exact' })

    if (userId) query = query.eq('user_id', userId)
    if (courseId) query = query.eq('course_id', courseId)
    if (verifyHash) query = query.eq('verify_hash', verifyHash)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .range(from, to)
      .order('issued_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        certificates: data,
        pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, data: existing, message: 'Certificate already exists' })
    }

    const { data: progress } = await supabase
      .from('enrollments')
      .select('progress')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, section:sections!inner(course_id)')
      .eq('sections.course_id', courseId)

    if (!progress || !lessons) {
      return NextResponse.json({ success: false, error: { message: 'No enrollment or lessons found' } }, { status: 400 })
    }

    const completedLessons = progress.progress ? Object.keys(progress.progress).filter(k => progress.progress[k]?.completed) : []
    const totalLessons = lessons.length
    const completionPercentage = (completedLessons.length / totalLessons) * 100

    if (completionPercentage < 100) {
      return NextResponse.json({ 
        success: false, 
        error: { message: `Course not completed. Current progress: ${Math.round(completionPercentage)}%` } 
      }, { status: 400 })
    }

    const verifyHash = generateVerifyHash()

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        course_id: courseId,
        verify_hash: verifyHash
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