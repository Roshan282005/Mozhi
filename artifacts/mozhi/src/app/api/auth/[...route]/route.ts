import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''

function getSupabaseClient(isAdmin = false): SupabaseClient {
  return createClient(supabaseUrl, isAdmin ? supabaseServiceKey : supabaseAnonKey)
}

// LOGIN - Email/Password
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  userType: z.enum(['student', 'teacher']).default('student'),
})

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname

  try {
    // LOGIN route
    if (path === '/api/auth/login') {
      const body = await request.json()
      const data = loginSchema.parse(body)

      const supabase = getSupabaseClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        return NextResponse.json({
          success: false,
          error: { code: 'AUTH_ERROR', message: authError.message },
        }, { status: 401 })
      }

      const userId = authData.user.id
      const table = data.userType === 'teacher' ? 'teachers' : 'students'
      const idField = data.userType === 'teacher' ? 'teacher_id' : 'user_id'

      const { data: profile } = await supabase
        .from(table)
        .select('*')
        .eq(idField, userId)
        .single()

      const fullName = data.userType === 'teacher' 
        ? profile?.display_name 
        : profile?.full_name || authData.user.user_metadata?.full_name || 'User'

      return NextResponse.json({
        success: true,
        data: {
          id: userId,
          email: authData.user.email,
          fullName: fullName,
          role: data.userType === 'teacher' ? 'companion' : 'explorer',
          locale: profile?.locale || 'en',
        },
      })
    }

    // REGISTER route
    if (path === '/api/auth/register') {
      const studentSchema = z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        userType: z.literal('student'),
        locale: z.string().default('en'),
      })

      const teacherSchema = z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        userType: z.literal('teacher'),
        displayName: z.string().min(2),
        bio: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        languagesSpoken: z.array(z.string()).default(['Tamil']),
      })

      const registerSchema = z.discriminatedUnion('userType', [studentSchema, teacherSchema])
      const body = await request.json()
      const data = registerSchema.parse(body)

      const supabase = getSupabaseClient(true) // Use service role key for admin operations
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName, user_type: data.userType },
      })

      if (authError) {
        return NextResponse.json({
          success: false,
          error: { code: 'AUTH_ERROR', message: authError.message },
        }, { status: 400 })
      }

      const userId = authData.user.id

      if (data.userType === 'student') {
        const { error: error } = await supabase.from('students').insert({
          id: crypto.randomUUID(),
          user_id: userId,
          full_name: data.fullName,
          locale: data.locale,
        })
        if (error) {
          await supabase.auth.admin.deleteUser(userId)
          return NextResponse.json({
            success: false,
            error: { code: 'PROFILE_ERROR', message: error.message },
          }, { status: 400 })
        }
      } else {
        const { error: error } = await supabase.from('teachers').insert({
          id: crypto.randomUUID(),
          user_id: userId,
          display_name: data.displayName,
          bio: data.bio || '',
          city: data.city || '',
          country: data.country || '',
          languages_spoken: data.languagesSpoken,
          status: 'PENDING',
        })
        if (error) {
          await supabase.auth.admin.deleteUser(userId)
          return NextResponse.json({
            success: false,
            error: { code: 'PROFILE_ERROR', message: error.message },
          }, { status: 400 })
        }
      }

      return NextResponse.json({
        success: true,
        data: { id: userId, email: data.email, fullName: data.fullName, role: data.userType === 'teacher' ? 'companion' : 'explorer' },
      })
    }

    // PHONE route
    if (path === '/api/auth/phone') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

      if (!accountSid || !authToken || !verifyServiceSid) {
        return NextResponse.json({ success: false, error: { message: 'Twilio not configured' } }, { status: 500 })
      }

      const { phoneNumber, action, code } = await request.json()
      
      // Format phone number to E.164
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
      let formattedPhone = cleanPhone
      if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
          formattedPhone = '+' + cleanPhone
        } else if (cleanPhone.length === 10) {
          formattedPhone = '+91' + cleanPhone
        } else {
          formattedPhone = '+' + cleanPhone
        }
      }

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

      if (action === 'send') {
        const response = await fetch(`https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `To=${formattedPhone}&Channel=sms`,
        })
        const data = await response.json()
        if (!response.ok) {
          return NextResponse.json({ success: false, error: { message: data.message || 'Failed to send OTP' } }, { status: 400 })
        }
        return NextResponse.json({ success: true, data: { status: data.status, to: data.to } })
      }

      if (action === 'verify') {
        const response = await fetch(`https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationChecks`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `To=${formattedPhone}&Code=${code}`,
        })
        const data = await response.json()
        if (!response.ok || data.status !== 'approved') {
          return NextResponse.json({ success: false, error: { message: data.message || 'Invalid code' } }, { status: 400 })
        }
        return NextResponse.json({ success: true, data: { id: crypto.randomUUID(), phone: formattedPhone, role: 'explorer' } })
      }

      return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 })
    }

    // GOOGLE CALLBACK
    if (path === '/api/auth/google/callback') {
      return NextResponse.json({ success: true, data: { message: 'OAuth handled client-side' } })
    }

    return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })

  } catch (error: any) {
    console.error('Auth API Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message } }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal error' } }, { status: 500 })
  }
}