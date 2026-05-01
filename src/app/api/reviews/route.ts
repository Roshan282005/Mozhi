import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId')
    const rating = searchParams.get('rating')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('course_reviews')
      .select(`
        *,
        user:users(id, full_name, avatar_url)
      `, { count: 'exact' })

    if (courseId) query = query.eq('course_id', courseId)
    if (userId) query = query.eq('user_id', userId)
    if (rating) query = query.eq('rating', parseInt(rating))

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    let avgRating = 0
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    
    if (courseId) {
      const { data: stats } = await supabase
        .from('course_reviews')
        .select('rating')
        .eq('course_id', courseId)

      if (stats) {
        const total = stats.reduce((acc, r) => acc + r.rating, 0)
        avgRating = stats.length > 0 ? total / stats.length : 0
        stats.forEach(r => ratingDistribution[r.rating as keyof typeof ratingDistribution]++)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: data,
        pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
        stats: { avgRating: Math.round(avgRating * 10) / 10, distribution: ratingDistribution }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId, rating, title, body: reviewBody } = body

    if (!userId || !courseId || !rating) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: { message: 'Rating must be between 1 and 5' } }, { status: 400 })
    }

    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    const { data: existingReview } = await supabase
      .from('course_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (existingReview) {
      const { data, error } = await supabase
        .from('course_reviews')
        .update({ rating, title, body: reviewBody })
        .eq('id', existingReview.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data, message: 'Review updated' })
    }

    const { data, error } = await supabase
      .from('course_reviews')
      .insert({
        user_id: userId,
        course_id: courseId,
        rating,
        title,
        body: reviewBody,
        is_verified: !!existingEnrollment
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    const { data: course } = await supabase
      .from('courses')
      .select('avg_rating, total_reviews')
      .eq('id', courseId)
      .single()

    if (course) {
      const { data: allReviews } = await supabase
        .from('course_reviews')
        .select('rating')
        .eq('course_id', courseId)

      const newAvgRating = allReviews 
        ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length 
        : rating

      await supabase
        .from('courses')
        .update({ 
          avg_rating: Math.round(newAvgRating * 10) / 10,
          total_reviews: allReviews?.length || 1
        })
        .eq('id', courseId)
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviewId, instructorReply } = body

    if (!reviewId || !instructorReply) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('course_reviews')
      .update({ 
        instructor_reply: instructorReply,
        replied_at: new Date().toISOString()
      })
      .eq('id', reviewId)
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