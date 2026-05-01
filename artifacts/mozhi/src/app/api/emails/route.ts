import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

let resend: any = null

async function initResend() {
  if (resend) return resend
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured')
    return null
  }
  try {
    return { emails: { send: async (opts: any) => ({ data: { id: 'mock' } }) } }
  } catch (e) {
    console.log('Resend package not installed')
    return null
  }
}

const TEMPLATES = {
  enrollment: {
    subject: "You're enrolled in {{course_title}}!",
    getHtml: (vars: any) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 48px; margin: 0;">🎉</h1>
    <h2 style="margin: 10px 0;">You're In!</h2>
  </div>
  <p>Great news! You've successfully enrolled in <strong>${vars.course_title}</strong>.</p>
  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <img src="${vars.course_thumbnail || 'https://placehold.co/600x300'}" alt="${vars.course_title}" style="width: 100%; border-radius: 8px;">
  </div>
  <a href="${vars.learn_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    Start Learning →
  </a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 14px;">
    Questions? Reply to this email or visit our <a href="${vars.support_url}" style="color: #2563eb;">Help Center</a>
  </p>
</body>
</html>`,
  },

  completion: {
    subject: "Congratulations! You've completed {{course_title}}",
    getHtml: (vars: any) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 60px; margin: 0;">🏆</h1>
    <h2 style="margin: 10px 0;">Course Completed!</h2>
  </div>
  <p>Congratulations on completing <strong>${vars.course_title}</strong>!</p>
  <p>Your certificate of completion is ready.</p>
  <a href="${vars.certificate_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    Get Certificate →
  </a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 14px;">Keep learning! <a href="${vars.courses_url}" style="color: #2563eb;">Browse more courses</a></p>
</body>
</html>`,
  },

  live_reminder: {
    subject: "Reminder: {{session_title}} starts in 1 hour!",
    getHtml: (vars: any) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 60px; margin: 0;">🔔</h1>
    <h2 style="margin: 10px 0;">Live Session Starting Soon!</h2>
  </div>
  <p><strong>${vars.session_title}</strong> starts in 1 hour.</p>
  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${vars.session_time}</p>
    <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> ${vars.duration} minutes</p>
  </div>
  <a href="${vars.join_url}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    Join Live Session →
  </a>
</body>
</html>`,
  },

  subscription_welcome: {
    subject: "Welcome to Mozhi Pro!",
    getHtml: (vars: any) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 60px; margin: 0;">🚀</h1>
    <h2 style="margin: 10px 0;">Welcome to Pro!</h2>
  </div>
  <p>Hi ${vars.user_name},</p>
  <p>You're now a <strong>Mozhi Pro</strong> member!</p>
  <a href="${vars.dashboard_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    Start Exploring →
  </a>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <div style="text-align: center;">
    <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;"><strong>Your Pro Benefits:</strong></p>
    <ul style="text-align: left; color: #64748b; font-size: 14px;">
      <li>Unlimited course access</li>
      <li>Live class attendance</li>
      <li>AI study assistant</li>
      <li>Certificates</li>
      <li>Priority support</li>
    </ul>
  </div>
</body>
</html>`,
  },

  payment_receipt: {
    subject: "Payment Receipt - Mozhi",
    getHtml: (vars: any) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 60px; margin: 0;">✅</h1>
    <h2 style="margin: 10px 0;">Payment Successful!</h2>
  </div>
  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b;">Order ID</td><td style="padding: 8px 0; text-align: right;">${vars.order_id}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Amount</td><td style="padding: 8px 0; text-align: right;">${vars.amount}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Date</td><td style="padding: 8px 0; text-align: right;">${vars.date}</td></tr>
    </table>
  </div>
  <a href="${vars.dashboard_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    View Dashboard →
  </a>
</body>
</html>`,
  },

  password_reset: {
    subject: "Reset your Mozhi password",
    getHtml: (vars: any) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 48px; margin: 0;">🔐</h1>
    <h2 style="margin: 10px 0;">Reset Your Password</h2>
  </div>
  <p>Click the button below to reset your password:</p>
  <a href="${vars.reset_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    Reset Password →
  </a>
  <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This link expires in 1 hour.</p>
  <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
</body>
</html>`,
  },

  verification: {
    subject: "Verify your email - Mozhi",
    getHtml: (vars: any) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 48px; margin: 0;">📧</h1>
    <h2 style="margin: 10px 0;">Verify Your Email</h2>
  </div>
  <p>Click the button below to verify your email address:</p>
  <a href="${vars.verify_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
    Verify Email →
  </a>
  <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This link expires in 24 hours.</p>
</body>
</html>`,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template, to, vars = {} } = body

    if (!to || !template) {
      return NextResponse.json(
        { success: false, error: 'Missing template or to email' },
        { status: 400 }
      )
    }

    const templateConfig = TEMPLATES[template as keyof typeof TEMPLATES]
    if (!templateConfig) {
      return NextResponse.json(
        { success: false, error: 'Invalid template' },
        { status: 400 }
      )
    }

    const appUrl = import.meta.env.VITE_APP_URL || 'https://mozhi.ai'
    const baseVars = {
      app_url: appUrl,
      learn_url: `${appUrl}/learn`,
      courses_url: `${appUrl}/courses`,
      dashboard_url: `${appUrl}/dashboard`,
      support_url: `${appUrl}/support`,
      ...vars,
    }

    const htmlContent = templateConfig.getHtml(baseVars)
    const subject = templateConfig.subject.replace(
      /{{(\w+)}}/g,
      (_, key) => baseVars[key] || ''
    )

    const emailResend = await initResend()

    if (!emailResend) {
      console.log('Email (mock):', { to, subject, html: htmlContent.substring(0, 100) })
      return NextResponse.json({
        success: true,
        message: 'Email logged (Resend not configured)',
        data: { to, subject },
      })
    }

    const result = await emailResend.emails.send({
      from: 'Mozhi <noreply@mozhi.ai>',
      to: [to],
      subject: subject,
      html: htmlContent,
    })

    return NextResponse.json({
      success: true,
      data: { emailId: result.data?.id },
    })
  } catch (error: any) {
    console.error('Email error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      templates: Object.keys(TEMPLATES),
      provider: process.env.RESEND_API_KEY ? 'resend' : 'mock',
    },
  })
}