import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const quizId = searchParams.get('quizId')
    const userId = searchParams.get('userId')
    const attemptId = searchParams.get('attemptId')

    if (lessonId) {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions(*)
        `)
        .eq('lesson_id', lessonId)
        .single()

      if (error || !quiz) {
        return NextResponse.json({ success: false, error: { message: 'Quiz not found' } }, { status: 404 })
      }

      if (!userId) {
        return NextResponse.json({ success: true, data: quiz })
      }

      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quiz.id)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })

      return NextResponse.json({ success: true, data: { ...quiz, attempts: attempts || [] } })
    }

    if (quizId) {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions(*)
        `)
        .eq('id', quizId)
        .single()

      if (error || !quiz) {
        return NextResponse.json({ success: false, error: { message: 'Quiz not found' } }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: quiz })
    }

    if (attemptId) {
      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('id', attemptId)
        .single()

      if (error || !attempt) {
        return NextResponse.json({ success: false, error: { message: 'Attempt not found' } }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: attempt })
    }

    return NextResponse.json({ success: false, error: { message: 'Provide lessonId or quizId' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, quizId, action, answers, timeTaken } = body

    if (!userId || !quizId) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    if (action === 'start') {
      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          quiz_id: quizId,
          answers: {},
          status: 'IN_PROGRESS'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data: attempt })
    }

    if (action === 'submit') {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions(*)
        `)
        .eq('id', quizId)
        .single()

      if (quizError || !quiz) {
        return NextResponse.json({ success: false, error: { message: 'Quiz not found' } }, { status: 404 })
      }

      let score = 0
      let maxScore = 0

      quiz.questions.forEach((question: any) => {
        maxScore += question.points
        const userAnswer = answers[question.id]
        if (userAnswer && JSON.stringify(userAnswer) === JSON.stringify(question.correct)) {
          score += question.points
        }
      })

      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
      const passed = percentage >= quiz.pass_score

      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .update({
          answers,
          score,
          max_score: maxScore,
          passed,
          time_taken: timeTaken,
          status: 'COMPLETED',
          submitted_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .eq('status', 'IN_PROGRESS')
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data: { ...attempt, percentage, passed } })
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid action' } }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}