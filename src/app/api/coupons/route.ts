import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const courseId = searchParams.get('courseId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    if (code) {
      let query = supabase
        .from('coupons')
        .select(`
          *,
          courses:coupon_courses(course:courses(id, title, slug))
        `)
        .eq('code', code)

      if (activeOnly) {
        query = query.eq('is_active', true)
          .gte('valid_until', new Date().toISOString())
      }

      const { data, error } = await query.single()

      if (error || !data) {
        return NextResponse.json({ success: false, error: { message: 'Invalid coupon' } }, { status: 404 })
      }

      const now = new Date()
      if (data.valid_from && new Date(data.valid_from) > now) {
        return NextResponse.json({ success: false, error: { message: 'Coupon not yet valid' } }, { status: 400 })
      }

      if (data.valid_until && new Date(data.valid_until) < now) {
        return NextResponse.json({ success: false, error: { message: 'Coupon expired' } }, { status: 400 })
      }

      if (data.max_uses && data.uses_count >= data.max_uses) {
        return NextResponse.json({ success: false, error: { message: 'Coupon usage limit reached' } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    let query = supabase.from('coupons').select('*')
    if (courseId) {
      query = query.eq('coupon_courses.course_id', courseId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

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
    const { code, discountType, discountValue, minPurchase, maxUses, validFrom, validUntil, courseIds } = body

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code,
        type: discountType,
        discount: discountValue,
        min_purchase: minPurchase,
        max_uses: maxUses,
        valid_from: validFrom,
        valid_until: validUntil,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    if (courseIds && courseIds.length > 0) {
      const couponCourses = courseIds.map((courseId: string) => ({
        coupon_id: data.id,
        course_id: courseId
      }))

      await supabase.from('coupon_courses').insert(couponCourses)
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { couponId, isActive, validUntil, maxUses } = body

    if (!couponId) {
      return NextResponse.json({ success: false, error: { message: 'couponId required' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('coupons')
      .update({
        is_active: isActive,
        valid_until: validUntil,
        max_uses: maxUses
      })
      .eq('id', couponId)
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