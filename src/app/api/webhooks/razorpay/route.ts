import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ success: false, error: { message: 'Missing signature' } }, { status: 400 })
    }

    const crypto = require('crypto')
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (generatedSignature !== signature) {
      return NextResponse.json({ success: false, error: { message: 'Invalid signature' } }, { status: 400 })
    }

    const event = JSON.parse(body)
    const eventType = event.event
    const payload = event.payload

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = payload.payment?.entity

        if (paymentEntity?.notes?.type === 'COURSE_PURCHASE') {
          const { userId, courseId } = paymentEntity.notes
          const amount = paymentEntity.amount ? paymentEntity.amount / 100 : 0

          await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              course_id: courseId,
              amount,
              currency: paymentEntity.currency?.toUpperCase() || 'INR',
              provider: 'RAZORPAY',
              razorpay_payment_id: paymentEntity.id,
              razorpay_order_id: paymentEntity.order_id,
              razorpay_signature: signature,
              status: 'COMPLETED',
              completed_at: new Date().toISOString()
            })

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
            link: '/courses/*'
          })
        }

        if (paymentEntity?.notes?.type === 'SUBSCRIPTION') {
          const { userId, plan } = paymentEntity.notes
          const amount = paymentEntity.amount ? paymentEntity.amount / 100 : 0

          await supabase
            .from('platform_subscriptions')
            .upsert({
              user_id: userId,
              tier: plan as any,
              razorpay_sub_id: paymentEntity.id,
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

      case 'subscription.activated': {
        const subscriptionEntity = payload.subscription?.entity
        const { userId, plan } = subscriptionEntity?.notes || {}

        if (userId && plan) {
          await supabase
            .from('platform_subscriptions')
            .upsert({
              user_id: userId,
              tier: plan as any,
              razorpay_sub_id: subscriptionEntity.id,
              status: 'ACTIVE',
              current_period_start: new Date().toISOString()
            }, { onConflict: 'user_id' })
        }
        break
      }

      case 'subscription.cancelled': {
        const subscriptionEntity = payload.subscription?.entity

        await supabase
          .from('platform_subscriptions')
          .update({
            status: 'CANCELLED',
            tier: 'FREE',
            cancelled_at: new Date().toISOString()
          })
          .eq('razorpay_sub_id', subscriptionEntity.id)

        break
      }

      case 'subscription.halted': {
        const subscriptionEntity = payload.subscription?.entity

        await supabase
          .from('platform_subscriptions')
          .update({ status: 'CANCELLED' })
          .eq('razorpay_sub_id', subscriptionEntity.id)

        const { data: sub } = await supabase
          .from('platform_subscriptions')
          .select('user_id')
          .eq('razorpay_sub_id', subscriptionEntity.id)
          .single()

        if (sub) {
          await supabase.from('notifications').insert({
            user_id: sub.user_id,
            type: 'PAYMENT_FAILED',
            title: 'Subscription payment failed',
            message: 'Your subscription payment failed. Please update your payment method.',
            link: '/subscriptions'
          })
        }
        break
      }

      case 'order.paid': {
        const orderEntity = payload.order?.entity
        const { userId, courseId, type } = orderEntity?.notes || {}

        if (type === 'COURSE_PURCHASE' && userId && courseId) {
          await supabase
            .from('transactions')
            .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
            .eq('razorpay_order_id', orderEntity.id)
        }
        break
      }

      default:
        console.log(`Unhandled Razorpay event: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Razorpay webhook error:', error)
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}