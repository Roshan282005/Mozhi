import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (userId) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, bio, role, subscription_tier, xp, streak, created_at')
        .eq('id', userId)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    let query = supabase
      .from('users')
      .select('id, email, full_name, avatar_url, bio, role, subscription_tier, xp, streak, created_at', { count: 'exact' })

    if (role) query = query.eq('role', role)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        users: data,
        pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fullName, avatarUrl, bio, role, action } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: { message: 'userId required' } }, { status: 400 })
    }

    if (action === 'update XP') {
      const { data: user } = await supabase
        .from('users')
        .select('xp')
        .eq('id', userId)
        .single()

      if (user) {
        const { data, error } = await supabase
          .from('users')
          .update({ xp: user.xp + (body.xpEarned || 0) })
          .eq('id', userId)
          .select()
          .single()

        if (error) {
          return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
        }

        return NextResponse.json({ success: true, data })
      }
    }

    if (action === 'streak') {
      const { data: user } = await supabase
        .from('users')
        .select('last_active_at, streak')
        .eq('id', userId)
        .single()

      if (user) {
        const today = new Date().toDateString()
        const lastActive = user.last_active_at ? new Date(user.last_active_at).toDateString() : null

        let newStreak = user.streak || 0
        if (lastActive !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          if (lastActive === yesterday.toDateString()) {
            newStreak += 1
          } else {
            newStreak = 1
          }
        }

        const { data, error } = await supabase
          .from('users')
          .update({ streak: newStreak, last_active_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single()

        if (error) {
          return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
        }

        return NextResponse.json({ success: true, data })
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        bio,
        role
      })
      .eq('id', userId)
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