import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { data: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true })
    const { data: totalCourses } = await supabase.from('courses').select('id', { count: 'exact', head: true })
    const { data: totalEnrollments } = await supabase.from('enrollments').select('id', { count: 'exact', head: true })
    const { data: totalReviews } = await supabase.from('course_reviews').select('id', { count: 'exact', head: true })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentEnrollments } = await supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('enrolled_at', thirtyDaysAgo.toISOString())

    const { data: monthlyTransactions } = await supabase
      .from('transactions')
      .select('amount, currency, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('status', 'COMPLETED')

    let totalRevenue = 0
    if (monthlyTransactions) {
      monthlyTransactions.forEach(t => {
        if (t.currency === 'INR') {
          totalRevenue += t.amount || 0
        }
      })
    }

    const { data: subscriptions } = await supabase
      .from('platform_subscriptions')
      .select('tier')
      .eq('status', 'ACTIVE')

    const tierDistribution = { FREE: 0, PRO: 0, PLUS: 0 }
    if (subscriptions) {
      subscriptions.forEach(s => {
        if (s.tier in tierDistribution) {
          tierDistribution[s.tier as keyof typeof tierDistribution]++
        }
      })
    }

    const { data: topCourses } = await supabase
      .from('courses')
      .select('id, title, total_enrolled, avg_rating')
      .eq('status', 'PUBLISHED')
      .order('total_enrolled', { ascending: false })
      .limit(10)

    const { data: topInstructors } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('role', 'TEACHER')
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers?.length || 0,
          totalCourses: totalCourses?.length || 0,
          totalEnrollments: totalEnrollments?.length || 0,
          recentEnrollments: recentEnrollments?.length || 0,
          monthlyRevenue: totalRevenue,
          totalReviews: totalReviews?.length || 0
        },
        subscriptions: tierDistribution,
        topCourses: topCourses || [],
        topInstructors: topInstructors || []
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}