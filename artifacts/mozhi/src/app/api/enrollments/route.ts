import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')

    let query = supabase
      .from('enrollments')
      .select(`
        *,
        user:users(id, full_name, email, avatar_url),
        course:courses(id, title, slug, thumbnail, price, is_free)
      `)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('enrolled_at', { ascending: false })

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
    const { userId, courseId, paymentId, couponCode } = body

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ success: false, error: { message: 'Course not found' } }, { status: 404 })
    }

    if (course.is_free) {
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (existingEnrollment) {
        return NextResponse.json({ success: true, data: existingEnrollment, message: 'Already enrolled' })
      }

      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          status: 'ACTIVE'
        })
        .select(`
          *,
          user:users(id, full_name, email, avatar_url),
          course:courses(id, title, slug, thumbnail, price, is_free)
        `)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('course_id', courseId)
        .gte('valid_until', new Date().toISOString())
        .single()

      if (coupon) {
        const { data, error } = await supabase
          .from('enrollments')
          .insert({
            user_id: userId,
            course_id: courseId,
            status: 'ACTIVE'
          })
          .select()
          .single()

        if (error) {
          return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
        }

        return NextResponse.json({ success: true, data })
      }
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'PENDING'
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