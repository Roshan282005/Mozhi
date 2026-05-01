import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const discussionId = searchParams.get('discussionId')

    if (!discussionId) {
      return NextResponse.json({ success: false, error: { message: 'discussionId required' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('discussion_replies')
      .select(`
        *,
        user:users(id, full_name, avatar_url)
      `)
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true })

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
    const { discussionId, userId, body: replyBody } = body

    if (!discussionId || !userId || !replyBody) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('discussion_replies')
      .insert({ discussion_id: discussionId, user_id: userId, body: replyBody })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    const { data: discussion } = await supabase
      .from('discussions')
      .select('lesson_id, user_id')
      .eq('id', discussionId)
      .single()

    if (discussion && discussion.user_id !== userId) {
      await supabase.from('notifications').insert({
        user_id: discussion.user_id,
        type: 'DISCUSSION_REPLY',
        title: 'New reply to your discussion',
        link: `/courses/*/lessons/${discussion.lesson_id}?discussion=${discussionId}`
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { replyId, body: replyBody, action } = body

    if (!replyId) {
      return NextResponse.json({ success: false, error: { message: 'replyId required' } }, { status: 400 })
    }

    if (action === 'upvote') {
      const { data: existing } = await supabase
        .from('discussion_replies')
        .select('upvotes')
        .eq('id', replyId)
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from('discussion_replies')
          .update({ upvotes: existing.upvotes + 1 })
          .eq('id', replyId)
          .select()
          .single()

        if (error) {
          return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
        }

        return NextResponse.json({ success: true, data })
      }
    }

    const { data, error } = await supabase
      .from('discussion_replies')
      .update({ body: replyBody })
      .eq('id', replyId)
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