import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const discussionId = searchParams.get('discussionId')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (discussionId) {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          user:users(id, full_name, avatar_url),
          replies(*, user:users(id, full_name, avatar_url))
        `)
        .eq('id', discussionId)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    let query = supabase
      .from('discussions')
      .select(`
        *,
        user:users(id, full_name, avatar_url),
        replies(count)
      `, { count: 'exact' })

    if (lessonId) query = query.eq('lesson_id', lessonId)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .range(from, to)
      .order('is_pinned', { ascending: false })
      .then(() => query.order('created_at', { ascending: false }))

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        discussions: data,
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
    const { userId, lessonId, title, body: discussionBody } = body

    if (!userId || !lessonId || !title || !discussionBody) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('discussions')
      .insert({ user_id: userId, lesson_id: lessonId, title, body: discussionBody })
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
    const { discussionId, title, body: discussionBody, isPinned, action } = body

    if (!discussionId) {
      return NextResponse.json({ success: false, error: { message: 'discussionId required' } }, { status: 400 })
    }

    if (action === 'upvote') {
      const { data: existing } = await supabase
        .from('discussions')
        .select('upvotes')
        .eq('id', discussionId)
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from('discussions')
          .update({ upvotes: existing.upvotes + 1 })
          .eq('id', discussionId)
          .select()
          .single()

        if (error) {
          return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
        }

        return NextResponse.json({ success: true, data })
      }
    }

    const { data, error } = await supabase
      .from('discussions')
      .update({ title, body: discussionBody, is_pinned: isPinned })
      .eq('id', discussionId)
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
    const discussionId = searchParams.get('discussionId')

    if (!discussionId) {
      return NextResponse.json({ success: false, error: { message: 'discussionId required' } }, { status: 400 })
    }

    const { error } = await supabase.from('discussions').delete().eq('id', discussionId)

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}