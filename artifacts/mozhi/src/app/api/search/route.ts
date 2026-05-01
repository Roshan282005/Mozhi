import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'courses'
    const categoryId = searchParams.get('category')
    const level = searchParams.get('level')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    if (!q || q.length < 2) {
      return NextResponse.json({ success: false, error: { message: 'Search query too short' } }, { status: 400 })
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    if (type === 'courses' || type === 'all') {
      let coursesQuery = supabase
        .from('courses')
        .select(`
          *,
          category:categories(name, slug),
          teacher:users(full_name, avatar_url)
        `, { count: 'exact' })
        .eq('status', 'PUBLISHED')
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)

      if (categoryId) coursesQuery = coursesQuery.eq('category_id', categoryId)
      if (level) coursesQuery = coursesQuery.eq('level', level)

      const { data: courses, count, error } = await coursesQuery
        .range(from, to)
        .order('total_enrolled', { ascending: false })

      if (type === 'courses') {
        return NextResponse.json({
          success: true,
          data: {
            courses: courses || [],
            pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
          }
        })
      }
    }

    const results: any = {}

    if (type === 'lessons' || type === 'all') {
      const { data: lessons } = await supabase
        .from('lessons')
        .select(`
          id, title, description, type, duration, is_free,
          section:sections!inner(id, title, course:courses(id, title, slug))
        `)
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(limit)

      results.lessons = lessons || []
    }

    if (type === 'instructors' || type === 'all') {
      const { data: instructors } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, bio')
        .eq('role', 'TEACHER')
        .ilike('full_name', `%${q}%`)
        .limit(10)

      results.instructors = instructors || []
    }

    if (type === 'categories') {
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
        .limit(10)

      return NextResponse.json({ success: true, data: { categories: categories || [] } })
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}