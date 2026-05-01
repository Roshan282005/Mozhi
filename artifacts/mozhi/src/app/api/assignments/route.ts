import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const assignmentId = searchParams.get('assignmentId')
    const userId = searchParams.get('userId')

    if (assignmentId) {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          lesson:lessons(id, title, section:sections!inner(course_id))
        `)
        .eq('id', assignmentId)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    if (lessonId) {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('lesson_id', lessonId)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      if (userId && data) {
        const { data: submission } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('assignment_id', data.id)
          .eq('user_id', userId)
          .single()

        return NextResponse.json({ success: true, data: { ...data, submission } })
      }

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: { message: 'Provide lessonId or assignmentId' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lessonId, title, description, dueDate, maxScore, action, submissionText, submissionFileUrl } = body

    if (action === 'submit') {
      const { lessonId, userId, text, fileUrl } = body

      if (!lessonId || !userId) {
        return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
      }

      const { data: assignment } = await supabase
        .from('assignments')
        .select('id')
        .eq('lesson_id', lessonId)
        .single()

      if (!assignment) {
        return NextResponse.json({ success: false, error: { message: 'No assignment found for this lesson' } }, { status: 404 })
      }

      const { data: existing } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .eq('user_id', userId)
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .update({
            text,
            file_url: fileUrl,
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
        }

        return NextResponse.json({ success: true, data })
      }

      const { data, error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: assignment.id,
          user_id: userId,
          text,
          file_url: fileUrl,
          status: 'SUBMITTED'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    if (!lessonId || !title) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('assignments')
      .select('*')
      .eq('lesson_id', lessonId)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('assignments')
        .update({ title, description, due_date: dueDate, max_score: maxScore || 100 })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        lesson_id: lessonId,
        title,
        description,
        due_date: dueDate,
        max_score: maxScore || 100
      })
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId, grade, feedback, status } = body

    if (!submissionId) {
      return NextResponse.json({ success: false, error: { message: 'submissionId required' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('assignment_submissions')
      .update({
        grade,
        feedback,
        status: status || 'GRADED',
        graded_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    const { data: submission } = await supabase
      .from('assignment_submissions')
      .select('user_id, assignments(lesson_id)')
      .eq('id', submissionId)
      .single()

    if (submission) {
      const lessonId = submission.assignments?.[0]?.lesson_id
      await supabase.from('notifications').insert({
        user_id: submission.user_id,
        type: 'ASSIGNMENT_GRADED',
        title: 'Assignment graded!',
        message: feedback ? `Feedback: ${feedback.substring(0, 100)}` : 'Your assignment has been graded.',
        link: lessonId ? `/courses/*/lessons/${lessonId}` : '/dashboard'
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}