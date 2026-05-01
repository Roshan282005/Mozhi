import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  let supabase: any = null
  
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Server not configured. Missing SUPABASE_URL or SERVICE_KEY.' } 
      }, { status: 500 })
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test connection
    const { data: testData, error: testError } = await supabase.from('users').select('id').limit(1)
    if (testError) {
      console.error('Supabase connection test failed:', testError.message)
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Cannot connect to database. Supabase may be paused. Error: ' + testError.message } 
      }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Failed to create Supabase client:', err.message)
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Database connection failed. Is Supabase paused?' } 
    }, { status: 500 })
  }
  
  try {
    const { idToken, email, displayName, photoURL, userType } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: { message: 'Email is required' } }, { status: 400 })
    }

    console.log('Processing Firebase login for:', email)

    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Select error:', selectError.message)
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Database query failed: ' + selectError.message } 
      }, { status: 500 })
    }

    if (existingUser) {
      console.log('Existing user found:', existingUser.id)
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: displayName || existingUser.full_name,
          avatar_url: photoURL || existingUser.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('Update error:', updateError.message)
      }

      return NextResponse.json({
        success: true,
        data: {
          id: existingUser.id,
          email: existingUser.email,
          fullName: existingUser.full_name,
          role: existingUser.role,
          avatarUrl: existingUser.avatar_url,
        },
      })
    }

    const userId = crypto.randomUUID()
    const role = userType === 'teacher' ? 'TEACHER' : 'STUDENT'
    console.log('Creating new user:', { userId, email, role, displayName })

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.trim().toLowerCase(),
        full_name: displayName || email.split('@')[0],
        avatar_url: photoURL || null,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Insert error:', createError.message, createError.details)
      return NextResponse.json({ 
        success: false, 
        error: { message: createError.message || 'Failed to create user. Check RLS policies or database status.' } 
      }, { status: 500 })
    }

    console.log('User created:', newUser?.id)

    return NextResponse.json({
      success: true,
      data: {
        id: newUser?.id,
        email: newUser?.email,
        fullName: newUser?.full_name,
        role: newUser?.role,
        avatarUrl: newUser?.avatar_url,
      },
    })
  } catch (error: any) {
    console.error('Firebase login error:', error.message || error)
    return NextResponse.json({ success: false, error: { message: error.message || 'Internal server error' } }, { status: 500 })
  }
}