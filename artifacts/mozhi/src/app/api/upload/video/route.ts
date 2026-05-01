import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'mozhi-videos'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, fileName, fileType, lessonId, courseId } = body

    if (action === 'getSimpleUploadUrl') {
      if (!fileName || !fileType || !lessonId) {
        return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
      }

      const key = `courses/${courseId || 'general'}/lessons/${lessonId}/${Date.now()}-${fileName}`
      const videoUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`

      return NextResponse.json({
        success: true,
        data: {
          key,
          videoUrl,
          uploadUrl: videoUrl + '?mock=true',
          message: 'Configure AWS credentials for actual upload'
        },
      })
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { resourceId, lessonId, status, videoUrl } = body

    if (status === 'ready' && videoUrl) {
      await supabase
        .from('lessons')
        .update({
          video_url: videoUrl,
          status: 'PUBLISHED'
        })
        .eq('id', lessonId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid request' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}