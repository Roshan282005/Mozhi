import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: { message: 'userId required' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        course:courses(id, title, slug, thumbnail, price, is_free, avg_rating, total_enrolled)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

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
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (existing) {
      await supabase.from('wishlists').delete().eq('id', existing.id)
      return NextResponse.json({ success: true, data: existing, action: 'removed' })
    }

    const { data, error } = await supabase
      .from('wishlists')
      .insert({ user_id: userId, course_id: courseId })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true, data, action: 'added' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const wishlistId = searchParams.get('id')

    if (wishlistId) {
      const { error } = await supabase.from('wishlists').delete().eq('id', wishlistId)
      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (userId && courseId) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId)

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