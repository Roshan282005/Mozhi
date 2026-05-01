-- RLS Policies for Mozhi Platform
-- Fully idempotent version with DROP POLICY IF EXISTS

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
CREATE POLICY "Anyone can view users" ON public.users FOR SELECT USING (true);

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can manage their own courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (status = 'PUBLISHED'::public."CourseStatus");
CREATE POLICY "Teachers can manage their own courses" ON public.courses FOR ALL USING (teacher_id = auth.uid()::text) WITH CHECK (teacher_id = auth.uid()::text);

-- Sections
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view sections" ON public.sections;
DROP POLICY IF EXISTS "Course owners can manage sections" ON public.sections;
CREATE POLICY "Anyone can view sections" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Course owners can manage sections" ON public.sections FOR ALL USING (EXISTS (SELECT 1 FROM public.courses WHERE id = sections.course_id AND teacher_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE id = sections.course_id AND teacher_id = auth.uid()::text));

-- Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Course owners can manage lessons" ON public.lessons;
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Course owners can manage lessons" ON public.lessons FOR ALL USING (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id WHERE s.id = lessons.section_id AND c.teacher_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id WHERE s.id = lessons.section_id AND c.teacher_id = auth.uid()::text));

-- Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enrolled users can view" ON public.enrollments;
DROP POLICY IF EXISTS "Anyone can enroll" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.enrollments;
CREATE POLICY "Enrolled users can view" ON public.enrollments FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Anyone can enroll" ON public.enrollments FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update their own enrollments" ON public.enrollments FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Progress
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.progress;
CREATE POLICY "Users can view their own progress" ON public.progress FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can update their own progress" ON public.progress FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Course owners can manage quizzes" ON public.quizzes;
CREATE POLICY "Anyone can view quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Course owners can manage quizzes" ON public.quizzes FOR ALL USING (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id WHERE l.id = quizzes.lesson_id AND c.teacher_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id WHERE l.id = quizzes.lesson_id AND c.teacher_id = auth.uid()::text));

-- Questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
DROP POLICY IF EXISTS "Course owners can manage questions" ON public.questions;
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Course owners can manage questions" ON public.questions FOR ALL USING (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id JOIN public.quizzes q ON q.lesson_id = l.id WHERE q.id = questions.quiz_id AND c.teacher_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id JOIN public.quizzes q ON q.lesson_id = l.id WHERE q.id = questions.quiz_id AND c.teacher_id = auth.uid()::text));

-- Quiz Attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can create quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can create quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Course owners can manage assignments" ON public.assignments;
CREATE POLICY "Anyone can view assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Course owners can manage assignments" ON public.assignments FOR ALL USING (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id WHERE l.id = assignments.lesson_id AND c.teacher_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id WHERE l.id = assignments.lesson_id AND c.teacher_id = auth.uid()::text));

-- Assignment Submissions
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Anyone can submit" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.assignment_submissions;
CREATE POLICY "Anyone can view submissions" ON public.assignment_submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can submit" ON public.assignment_submissions FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update their own submissions" ON public.assignment_submissions FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Reviews
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Anyone can review" ON public.course_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.course_reviews;
CREATE POLICY "Anyone can view reviews" ON public.course_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can review" ON public.course_reviews FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update their own reviews" ON public.course_reviews FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON public.wishlists;
CREATE POLICY "Users can view their own wishlists" ON public.wishlists FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can manage their own notes" ON public.notes FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Discussions
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view discussions" ON public.discussions;
DROP POLICY IF EXISTS "Enrolled users can post" ON public.discussions;
DROP POLICY IF EXISTS "Users can update their own discussions" ON public.discussions;
CREATE POLICY "Anyone can view discussions" ON public.discussions FOR SELECT USING (true);
CREATE POLICY "Enrolled users can post" ON public.discussions FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update their own discussions" ON public.discussions FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Discussion Replies
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view replies" ON public.discussion_replies;
DROP POLICY IF EXISTS "Enrolled users can reply" ON public.discussion_replies;
DROP POLICY IF EXISTS "Users can update their own replies" ON public.discussion_replies;
CREATE POLICY "Anyone can view replies" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "Enrolled users can reply" ON public.discussion_replies FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update their own replies" ON public.discussion_replies FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Users can view their own certificates" ON public.certificates FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN'::public."UserRole")) WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN'::public."UserRole"));

-- Live Sessions
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view live sessions" ON public.live_sessions;
DROP POLICY IF EXISTS "Teachers can manage live sessions" ON public.live_sessions;
CREATE POLICY "Anyone can view live sessions" ON public.live_sessions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage live sessions" ON public.live_sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id WHERE l.id = live_sessions.lesson_id AND c.teacher_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id WHERE l.id = live_sessions.lesson_id AND c.teacher_id = auth.uid()::text));

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (user_id = auth.uid()::text);

-- Platform Subscriptions
ALTER TABLE public.platform_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.platform_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscription" ON public.platform_subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.platform_subscriptions FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can manage their own subscription" ON public.platform_subscriptions FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN'::public."UserRole")) WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN'::public."UserRole"));

-- Coupon Courses
ALTER TABLE public.coupon_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view coupon courses" ON public.coupon_courses;
CREATE POLICY "Anyone can view coupon courses" ON public.coupon_courses FOR SELECT USING (true);

-- AI Chats
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own AI chats" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can manage their own AI chats" ON public.ai_chats;
CREATE POLICY "Users can view their own AI chats" ON public.ai_chats FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can manage their own AI chats" ON public.ai_chats FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
DROP POLICY IF EXISTS "Course owners can manage resources" ON public.resources;
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Course owners can manage resources" ON public.resources FOR ALL USING (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id WHERE l.id = resources.lesson_id AND c.teacher_id = auth.uid()::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.courses c JOIN public.sections s ON s.course_id = c.id JOIN public.lessons l ON l.section_id = s.id WHERE l.id = resources.lesson_id AND c.teacher_id = auth.uid()::text));

-- Learning Goals
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own learning goals" ON public.learning_goals;
DROP POLICY IF EXISTS "Users can manage their own learning goals" ON public.learning_goals;
CREATE POLICY "Users can view their own learning goals" ON public.learning_goals FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can manage their own learning goals" ON public.learning_goals FOR ALL USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

-- Realtime messages (for Broadcast channels)
-- Note: Create realtime.messages table if not exists, then add policies:

-- CREATE TABLE IF NOT EXISTS realtime.messages (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   room_id UUID NOT NULL,
--   user_id UUID NOT NULL,
--   message TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE POLICY "authenticated_users_can_receive" ON realtime.messages FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "authenticated_users_can_send" ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true);