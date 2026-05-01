import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-03-25.dahlia' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ success: false, error: { message: 'Missing signature' } }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ success: false, error: { message: 'Invalid signature' } }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'payment' && session.metadata?.type === 'COURSE_PURCHASE') {
          const { userId, courseId } = session.metadata

          const { data: transaction } = await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              course_id: courseId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency?.toUpperCase() || 'INR',
              provider: 'STRIPE',
              stripe_payment_id: session.payment_intent as string,
              stripe_session_id: session.id,
              status: 'COMPLETED',
              completed_at: new Date().toISOString()
            })
            .select()
            .single()

          await supabase
            .from('enrollments')
            .upsert({
              user_id: userId,
              course_id: courseId,
              status: 'ACTIVE'
            }, { onConflict: 'user_id,course_id' })

          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'PURCHASE',
            title: 'Course purchased successfully!',
            message: 'You can now access the course content.',
            link: `/courses/*`
          })
        }

        if (session.mode === 'subscription' && session.metadata?.type === 'SUBSCRIPTION') {
          const { userId, plan } = session.metadata

          await supabase
            .from('platform_subscriptions')
            .upsert({
              user_id: userId,
              tier: plan as any,
              stripe_sub_id: session.subscription as string,
              status: 'ACTIVE',
              current_period_start: new Date().toISOString()
            }, { onConflict: 'user_id' })

          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'SUBSCRIPTION',
            title: 'Subscription activated!',
            message: `Your ${plan} subscription is now active.`,
            link: '/dashboard'
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const { data: existing } = await supabase
          .from('platform_subscriptions')
          .select('user_id')
          .eq('stripe_sub_id', subscription.id)
          .single()

        if (existing) {
          const subData = subscription as any
          await supabase
            .from('platform_subscriptions')
            .update({
              status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_end: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null
            })
            .eq('stripe_sub_id', subscription.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('platform_subscriptions')
          .update({
            status: 'CANCELLED',
            tier: 'FREE',
            cancelled_at: new Date().toISOString()
          })
          .eq('stripe_sub_id', subscription.id)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceData = invoice as any

        if (invoiceData.subscription) {
          const { data: sub } = await supabase
            .from('platform_subscriptions')
            .select('user_id')
            .eq('stripe_sub_id', invoiceData.subscription as string)
            .single()

          if (sub) {
            await supabase.from('notifications').insert({
              user_id: sub.user_id,
              type: 'PAYMENT_FAILED',
              title: 'Payment failed',
              message: 'Your subscription payment failed. Please update your payment method.',
              link: '/subscriptions'
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}