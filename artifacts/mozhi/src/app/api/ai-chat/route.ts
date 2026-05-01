import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

let anthropic: any = null
try {
  const Anthropic = require('@anthropic-ai/sdk')
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })
} catch (e) {
  console.log('Anthropic SDK not installed')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const lessonId = searchParams.get('lessonId')
    const courseId = searchParams.get('courseId')
    const chatId = searchParams.get('chatId')

    if (chatId) {
      const { data, error } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('id', chatId)
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    let query = supabase
      .from('ai_chats')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) query = query.eq('user_id', userId)
    if (lessonId) query = query.eq('lesson_id', lessonId)
    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query.limit(20)

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
    const { userId, lessonId, courseId, message, generateQuiz } = body

    if (!userId || !message) {
      return NextResponse.json({ success: false, error: { message: 'Missing required fields' } }, { status: 400 })
    }

    let context = ''
    let chatHistory: any[] = []

    if (lessonId) {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('*, section:sections!inner(title, course:courses(title))')
        .eq('id', lessonId)
        .single()

      if (lesson) {
        context = `Current lesson: "${lesson.title}"\nSection: "${lesson.section?.title}"\nCourse: "${lesson.section?.course?.title}"`
      }

      const { data: chats } = await supabase
        .from('ai_chats')
        .select('messages')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (chats?.messages) {
        chatHistory = chats.messages
      }
    }

    if (courseId) {
      const { data: course } = await supabase
        .from('courses')
        .select('title, description')
        .eq('id', courseId)
        .single()

      if (course) {
        context = `Course: "${course.title}"\n${course.description || ''}`
      }
    }

    const systemPrompt = `You are an AI study assistant for an online learning platform called Mozhi. 
Your role is to help students understand course concepts, answer questions, and provide educational support.
Context: ${context}
Guidelines:
- Be helpful, patient, and educational
- Use simple language appropriate for learners
- Provide examples when helpful
- If you don't know something, admit it and suggest where to find the answer
- Don't provide direct answers to quiz questions - guide students to find the answer themselves`

    const messages = [
      ...chatHistory.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    })

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I could not generate a response.'

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

    let chatData
    const updatedMessages = [...chatHistory, { role: 'user', content: message }, { role: 'assistant', content: assistantMessage }]

    if (lessonId) {
      const { data: existing } = await supabase
        .from('ai_chats')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from('ai_chats')
          .update({ messages: updatedMessages, tokens_used: existing.tokens_used + tokensUsed })
          .eq('id', existing.id)
          .select()
          .single()

        chatData = data
      } else {
        const { data, error } = await supabase
          .from('ai_chats')
          .insert({
            user_id: userId,
            lesson_id: lessonId,
            course_id: courseId,
            messages: updatedMessages,
            tokens_used: tokensUsed
          })
          .select()
          .single()

        chatData = data
      }
    } else {
      const { data, error } = await supabase
        .from('ai_chats')
        .insert({
          user_id: userId,
          course_id: courseId,
          messages: updatedMessages,
          tokens_used: tokensUsed
        })
        .select()
        .single()

      chatData = data
    }

    if (generateQuiz && lessonId) {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('*, section:sections!inner(course_id)')
        .eq('id', lessonId)
        .single()

      if (lesson) {
        const quizPrompt = `Generate 5 multiple choice quiz questions based on the lesson: "${lesson.title}"
        Content: ${lesson.description || 'N/A'}
        
        Format as JSON array with this structure:
        [{
          "question": "Question text",
          "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
          "correct": "A)",
          "points": 1
        }]`

        const quizResponse = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [{ role: 'user', content: quizPrompt }]
        })

        const quizContent = quizResponse.content[0].type === 'text' ? quizResponse.content[0].text : '[]'

        return NextResponse.json({
          success: true,
          data: {
            chat: chatData,
            response: assistantMessage,
            suggestedQuiz: JSON.parse(quizContent)
          }
        })
      }
    }

    return NextResponse.json({ success: true, data: { chat: chatData, response: assistantMessage } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 })
  }
}