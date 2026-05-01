import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  try {
    // Test Supabase connection
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey || '',
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    return NextResponse.json({
      success: true,
      supabaseUrl,
      supabaseStatus: response.status,
      message: response.ok ? 'Supabase connected!' : 'Supabase error'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      supabaseUrl
    })
  }
}