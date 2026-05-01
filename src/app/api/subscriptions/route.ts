import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-03-25.dahlia' })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const plan = searchParams.get('plan')
    const status = searchParams.get('status')

    let query = supabase
      .from('platform_subscriptions')
      .select('*, user:users(id, full_name, email)')

    if (userId) query = query.eq('user_id', userId)
    if (plan) query = query.eq('plan', plan)
    if (status) query = query.eq('status', status)

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
    const { userId, plan, provider, interval = 'month' } = body

    if (!userId || !plan) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const plans: Record<string, { price: number; name: string }> = {
      FREE: { price: 0, name: 'Free' },
      PRO: { price: 499, name: 'Pro' },
      PLUS: { price: 1499, name: 'Plus' }
    }

    if (!plans[plan]) {
      return NextResponse.json({ success: false, error: { message: 'Invalid plan' } }, { status: 400 })
    }

    if (plan === 'FREE') {
      const { data, error } = await supabase
        .from('platform_subscriptions')
        .upsert({
          user_id: userId,
          plan: 'FREE',
          status: 'ACTIVE',
          provider: 'FREE',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    if (provider === 'stripe') {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      const priceInterval = interval === 'year' ? 'year' : 'month'

      let price: any = null
      try {
        const existingPrices = await stripe.prices.list({ limit: 10 })
        price = existingPrices.data[0] || null
      } catch (e) {
        price = null
      }

      if (!price) {
        price = await stripe.prices.create({
          unit_amount: plans[plan].price * 100,
          currency: 'inr',
          recurring: { interval: priceInterval as 'month' | 'year' },
          product_data: { name: `${plans[plan].name} Plan` }
        })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: price.id, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        customer_email: user?.email,
        metadata: { userId, plan, type: 'SUBSCRIPTION' }
      })

      return NextResponse.json({ success: true, data: { sessionId: session.id, url: session.url } })
    }

    if (provider === 'razorpay') {
      const planPrices: Record<string, number> = {
        PRO_MONTH: 49900,
        PRO_YEAR: 499900,
        PLUS_MONTH: 149900,
        PLUS_YEAR: 1499900
      }

      const planKey = `${plan}_${interval.toUpperCase()}`
      const amount = planPrices[planKey] || plans[plan].price * 100

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const subcription = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`
        },
        body: JSON.stringify({
          plan_id: `plan_${planKey.toLowerCase()}`,
          customer_id: user?.razorpay_customer_id,
          total_count: interval === 'year' ? 1 : 12,
          notes: { userId, plan }
        })
      }).then(res => res.json())

      return NextResponse.json({
        success: true,
        data: { subscriptionId: subcription.id, url: subcription.short_url }
      })
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid provider' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, status, plan, currentPeriodEnd } = body

    if (subscriptionId && status) {
      const { data, error } = await supabase
        .from('platform_subscriptions')
        .update({
          status,
          plan: plan || undefined,
          current_period_end: currentPeriodEnd || undefined
        })
        .eq('stripe_subscription_id', subscriptionId)
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