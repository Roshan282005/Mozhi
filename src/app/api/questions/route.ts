import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    const questionId = searchParams.get('questionId')

    if (questionId) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    if (!quizId) {
      return NextResponse.json({ success: false, error: { message: 'quizId required' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order', { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { quizId, questions: newQuestions } = body

    if (!quizId || !newQuestions || !Array.isArray(newQuestions)) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('id')
      .eq('quiz_id', quizId)

    if (existingQuestions && existingQuestions.length > 0) {
      await supabase.from('questions').delete().eq('quiz_id', quizId)
    }

    const questionsToInsert = newQuestions.map((q: any, index: number) => ({
      quiz_id: quizId,
      text: q.text,
      type: q.type || 'mcq',
      options: q.options,
      correct: q.correct,
      points: q.points || 1,
      order: index + 1
    }))

    const { data, error } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select()

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
    const { questionId, text, options, correct, points } = body

    if (!questionId) {
      return NextResponse.json({ success: false, error: { message: 'questionId required' } }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('questions')
      .update({ text, options, correct, points })
      .eq('id', questionId)
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({ success: false, error: { message: 'questionId required' } }, { status: 400 })
    }

    const { error } = await supabase.from('questions').delete().eq('id', questionId)

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}