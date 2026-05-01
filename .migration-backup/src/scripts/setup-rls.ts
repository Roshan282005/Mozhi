import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupRLSPolicies() {
  try {
    console.log('Setting up Row Level Security (RLS) policies for Mozhi platform...')

    const tables = [
      'users', 'categories', 'courses', 'sections', 'lessons', 'quizzes', 'questions',
      'quiz_attempts', 'assignments', 'assignment_submissions', 'live_sessions', 'enrollments',
      'progress', 'certificates', 'platform_subscriptions', 'transactions', 'course_reviews',
      'wishlists', 'notes', 'discussions', 'discussion_replies', 'resources',
      'learning_goals', 'ai_chats', 'coupons', 'coupon_courses', 'notifications'
    ]

    for (const table of tables) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`)
      console.log(`Enabled RLS on ${table}`)
    }

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Anyone can read published courses" ON "courses"
      FOR SELECT USING (status = 'PUBLISHED');
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Teachers can manage their courses" ON "courses"
      FOR ALL USING (teacher_id IN (SELECT id FROM users WHERE auth.uid() = id))
      WITH CHECK (teacher_id IN (SELECT id FROM users WHERE auth.uid() = id));
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Anyone can read published categories" ON "categories"
      FOR SELECT USING (true);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Admins can manage categories" ON "categories"
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can read lessons in enrolled courses" ON "lessons"
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM enrollments
          WHERE enrollments.course_id = lessons.section_id
          AND enrollments.user_id = auth.uid()
          AND enrollments.status = 'ACTIVE'
        )
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Teachers can manage lessons" ON "lessons"
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM courses
          WHERE courses.id = sections.course_id
          AND courses.teacher_id = auth.uid()
        )
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Enrolled users can read enrollments" ON "enrollments"
      FOR SELECT USING (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can manage their enrollments" ON "enrollments"
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can read their progress" ON "progress"
      FOR SELECT USING (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can manage their progress" ON "progress"
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can read their notes" ON "notes"
      FOR SELECT USING (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can manage their notes" ON "notes"
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public can read published quizzes" ON "quizzes"
      FOR SELECT USING (true);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can submit quiz attempts" ON "quiz_attempts"
      FOR INSERT WITH CHECK (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can read their quiz attempts" ON "quiz_attempts"
      FOR SELECT USING (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Teachers can grade assignments" ON "assignment_submissions"
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM courses
          JOIN sections ON sections.course_id = courses.id
          JOIN lessons ON lessons.section_id = sections.id
          JOIN assignments ON assignments.lesson_id = lessons.id
          WHERE assignments.id = assignment_submissions.assignment_id
          AND courses.teacher_id = auth.uid()
        )
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can manage their course reviews" ON "course_reviews"
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public can read course reviews" ON "course_reviews"
      FOR SELECT USING (true);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can read their wishlists" ON "wishlists"
      FOR SELECT USING (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can manage their wishlists" ON "wishlists"
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can read their certificates" ON "certificates"
      FOR SELECT USING (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public can verify certificates" ON "certificates"
      FOR SELECT USING (true);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can manage their subscriptions" ON "platform_subscriptions"
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can read teacher profiles" ON "users"
      FOR SELECT WHEN ROLE = 'TEACHER';
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can update own profile" ON "users"
      FOR UPDATE USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Admins can manage all" ON "users"
      FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can read notifications" ON "notifications"
      FOR SELECT USING (user_id = auth.uid());
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can manage their notifications" ON "notifications"
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `)

    console.log('All RLS policies set up successfully!')
  } catch (error) {
    console.error('Error setting up RLS policies:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupRLSPolicies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to set up RLS policies:', error)
    process.exit(1)
  })