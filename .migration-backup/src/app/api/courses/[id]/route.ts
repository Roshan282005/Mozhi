import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeSections = searchParams.get('sections') === 'true'

    let courseQuery = supabase
      .from('courses')
      .select(`
        *,
        category:categories(name, slug, icon),
        teacher:users!courses_teacher_id_fkey(id, full_name, avatar_url, bio)
      `)

    const { data: course, error } = await (id.includes('-') 
      ? courseQuery.eq('id', id).single()
      : courseQuery.eq('slug', id).single()
    )

    if (error || !course) {
      return NextResponse.json({ success: false, error: { message: 'Course not found' } }, { status: 404 })
    }

    let sections = []
    if (includeSections) {
      const { data: sectionsData } = await supabase
        .from('sections')
        .select(`
          *,
          lessons(
            id, title, type, order, video_duration, is_free, is_preview
          )
        `)
        .eq('course_id', course.id)
        .order('order')

      sections = sectionsData || []
    }

    const { data: reviews } = await supabase
      .from('course_reviews')
      .select('*, user:users!course_reviews_user_id_fkey(full_name, avatar_url)')
      .eq('course_id', course.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        sections,
        reviews
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      'title', 'description', 'thumbnail_url', 'price', 'is_free',
      'discount_price', 'discount_ends_at', 'status', 'requirements', 'outcomes',
      'language', 'level', 'is_featured'
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}