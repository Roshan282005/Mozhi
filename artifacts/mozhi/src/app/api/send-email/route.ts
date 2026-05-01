import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''

async function sendWithSendGrid(to: string, subject: string, html: string) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@mozhi.ai', name: 'Mozhi' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error)
  }

  return { id: response.headers.get('x-message-id') }
}

const TEMPLATES = {
  enrollment: {
    subject: "You're enrolled in {{course_title}}!",
    getHtml: (v: any) => `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;font-size:48px;">🎉</div><h2>You're In!</h2><p>You've enrolled in <strong>${v.course_title}</strong>.</p><a href="${v.learn_url}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Start Learning →</a></body></html>`,
  },
  completion: {
    subject: "Congratulations! Completed {{course_title}}",
    getHtml: (v: any) => `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;font-size:60px;">🏆</div><h2>Course Completed!</h2><p>Congratulations on completing <strong>${v.course_title}</strong>!</p><a href="${v.certificate_url}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Get Certificate →</a></body></html>`,
  },
  live_reminder: {
    subject: "{{session_title}} starts in 1 hour!",
    getHtml: (v: any) => `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;font-size:60px;">🔔</div><h2>Live Session Starting Soon!</h2><p><strong>${v.session_title}</strong> starts in 1 hour.</p><a href="${v.join_url}" style="display:inline-block;background:#dc2626;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Join Now →</a></body></html>`,
  },
  subscription_welcome: {
    subject: "Welcome to Mozhi Pro!",
    getHtml: (v: any) => `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;font-size:60px;">🚀</div><h2>Welcome to Pro!</h2><p>Hi ${v.user_name}, you're now a Mozhi Pro member!</p><a href="${v.dashboard_url}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Start Exploring →</a></body></html>`,
  },
  payment_receipt: {
    subject: "Payment Receipt - Mozhi",
    getHtml: (v: any) => `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;font-size:60px;">✅</div><h2>Payment Successful!</h2><p>Order: ${v.order_id}<br>Amount: ${v.amount}</p><a href="${v.dashboard_url}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">View Dashboard →</a></body></html>`,
  },
  password_reset: {
    subject: "Reset your Mozhi password",
    getHtml: (v: any) => `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;font-size:48px;">🔐</div><h2>Reset Password</h2><a href="${v.reset_url}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password →</a><p style="color:#666;font-size:14px;margin-top:20px;">This link expires in 1 hour.</p></body></html>`,
  },
  verification: {
    subject: "Verify your email - Mozhi",
    getHtml: (v: any) => `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><div style="text-align:center;font-size:48px;">📧</div><h2>Verify Your Email</h2><a href="${v.verify_url}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Verify Email →</a><p style="color:#666;font-size:14px;margin-top:20px;">This link expires in 24 hours.</p></body></html>`,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider = 'resend', template, to, vars = {} } = body

    if (!to || !template) {
      return NextResponse.json({ success: false, error: 'Missing template or to' }, { status: 400 })
    }

    const tpl = TEMPLATES[template as keyof typeof TEMPLATES]
    if (!tpl) {
      return NextResponse.json({ success: false, error: 'Invalid template' }, { status: 400 })
    }

    const appUrl = import.meta.env.VITE_APP_URL || 'https://mozhi.ai'
    const baseVars = {
      app_url: appUrl, learn_url: `${appUrl}/learn`, courses_url: `${appUrl}/courses`,
      dashboard_url: `${appUrl}/dashboard`, support_url: `${appUrl}/support`, ...vars,
    }

    const html = tpl.getHtml(baseVars)
    const subject = tpl.subject.replace(/{{(\w+)}}/g, (_, k) => baseVars[k] || '')

    if (provider === 'sendgrid' && SENDGRID_API_KEY) {
      const result = await sendWithSendGrid(to, subject, html)
      return NextResponse.json({ success: true, data: { emailId: result.id, provider: 'sendgrid' } })
    }

    return NextResponse.json({
      success: true,
      message: 'Configure SENDGRID_API_KEY for SendGrid',
      data: { provider: 'mock', to, subject },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      templates: Object.keys(TEMPLATES),
      providers: ['resend', 'sendgrid'],
      configured: {
        resend: !!process.env.RESEND_API_KEY,
        sendgrid: !!SENDGRID_API_KEY,
      },
    },
  })
}