import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PUBLISHED'
    const categoryId = searchParams.get('category')
    const teacherId = searchParams.get('teacher')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    let query = supabase
      .from('courses')
      .select(`
        *,
        category:categories(name, slug),
        teacher:users!courses_teacher_id_fkey(full_name, avatar_url),
        sections(count),
        enrollments(count)
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    
    if (teacherId) {
      query = query.eq('teacher_id', teacherId)
    }
    
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        courses: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, description, categoryId, price, isFree, language, level, requirements, outcomes, teacherId } = body

    if (!title || !slug || !description || !teacherId) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title,
        slug,
        description,
        category_id: categoryId,
        teacher_id: teacherId,
        price: price || 0,
        is_free: isFree || false,
        language: language || 'Tamil',
        level: level || 'beginner',
        requirements,
        outcomes,
        status: 'DRAFT'
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