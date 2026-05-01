import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-03-25.dahlia' })
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')
    const paymentId = searchParams.get('paymentId')

    let query = supabase
      .from('transactions')
      .select(`
        *,
        user:users(id, full_name, email),
        course:courses(id, title, slug)
      `)

    if (userId) query = query.eq('user_id', userId)
    if (courseId) query = query.eq('course_id', courseId)
    if (status) query = query.eq('status', status)
    if (paymentId) query = query.eq('razorpay_payment_id', paymentId)

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
    const { userId, courseId, amount, currency, provider, couponCode } = body

    if (!userId || !courseId || !amount) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*, teacher:users!inner(email)')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ success: false, error: { message: 'Course not found' } }, { status: 404 })
    }

    let finalAmount = course.price

    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('course_id', courseId)
        .gte('valid_until', new Date().toISOString())
        .single()

      if (coupon) {
        if (coupon.discount_type === 'PERCENTAGE') {
          finalAmount = finalAmount - (finalAmount * coupon.discount_value) / 100
        } else {
          finalAmount = finalAmount - coupon.discount_value
        }
      }
    }

    if (provider === 'stripe') {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currency || 'INR',
            product_data: {
              name: course.title,
              description: course.description || undefined
            },
            unit_amount: Math.round(finalAmount * 100)
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.slug}`,
        customer_email: user?.email,
        metadata: {
          userId,
          courseId,
          type: 'COURSE_PURCHASE'
        }
      })

      return NextResponse.json({ success: true, data: { sessionId: session.id, url: session.url } })
    }

    if (provider === 'razorpay') {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const { data: razorpayOrder } = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
        },
        body: JSON.stringify({
          amount: Math.round(finalAmount * 100),
          currency: currency || 'INR',
          receipt,
          notes: {
            userId,
            courseId,
            userEmail: user?.email,
            userName: user?.full_name
          }
        })
      }).then(res => res.json())

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          course_id: courseId,
          amount: finalAmount,
          currency: currency || 'INR',
          provider: 'RAZORPAY',
          razorpay_order_id: razorpayOrder?.id,
          status: 'PENDING'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: {
          orderId: razorpayOrder?.id,
          amount: finalAmount,
          currency: currency || 'INR',
          transactionId: data.id
        }
      })
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid payment provider' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, transactionId, status } = body

    if (razorpayPaymentId && razorpayOrderId && razorpaySignature && transactionId) {
      const crypto = require('crypto')
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex')

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json({ success: false, error: { message: 'Invalid signature' } }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'COMPLETED',
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          completed_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .eq('razorpay_order_id', razorpayOrderId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .upsert({
          user_id: data.user_id,
          course_id: data.course_id,
          status: 'ACTIVE'
        }, { onConflict: 'user_id,course_id' })

      if (enrollmentError) {
        console.error('Enrollment error:', enrollmentError)
      }

      return NextResponse.json({ success: true, data })
    }

    if (transactionId && status) {
      const { data, error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', transactionId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}