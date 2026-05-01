/*
  Warnings:

  - You are about to drop the column `companion_id` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `companion_id` on the `pricing_plans` table. All the data in the column will be lost.
  - You are about to drop the column `companion_id` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `companion_reply` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `explorer_id` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `companion_id` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `companion_note` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `explorer_id` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `companion_id` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `explorer_id` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the `companion_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profiles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `teacher_id` to the `availability_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_type` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_id` to the `pricing_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_id` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `student_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('STUDENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- DropForeignKey
ALTER TABLE "availability_slots" DROP CONSTRAINT "availability_slots_companion_id_fkey";

-- DropForeignKey
ALTER TABLE "companion_profiles" DROP CONSTRAINT "companion_profiles_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "companion_profiles" DROP CONSTRAINT "companion_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "pricing_plans" DROP CONSTRAINT "pricing_plans_companion_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_companion_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_explorer_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_companion_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_explorer_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_companion_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_explorer_id_fkey";

-- AlterTable
ALTER TABLE "availability_slots" DROP COLUMN "companion_id",
ADD COLUMN     "teacher_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "sender_type" "SenderType" NOT NULL;

-- AlterTable
ALTER TABLE "pricing_plans" DROP COLUMN "companion_id",
ADD COLUMN     "teacher_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "companion_id",
DROP COLUMN "companion_reply",
DROP COLUMN "explorer_id",
ADD COLUMN     "student_id" TEXT NOT NULL,
ADD COLUMN     "teacher_id" TEXT NOT NULL,
ADD COLUMN     "teacher_reply" TEXT;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "companion_id",
DROP COLUMN "companion_note",
DROP COLUMN "explorer_id",
ADD COLUMN     "student_id" TEXT NOT NULL,
ADD COLUMN     "teacher_id" TEXT NOT NULL,
ADD COLUMN     "teacher_note" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "companion_id",
DROP COLUMN "explorer_id",
ADD COLUMN     "student_id" TEXT NOT NULL,
ADD COLUMN     "teacher_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "companion_profiles";

-- DropTable
DROP TABLE "profiles";

-- DropEnum
DROP TYPE "CompanionStatus";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "city" TEXT,
    "country" TEXT,
    "show_location" BOOLEAN NOT NULL DEFAULT true,
    "languages_spoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "style_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "session_style_desc" TEXT,
    "intro_video_url" TEXT,
    "sample_content_url" TEXT,
    "status" "TeacherStatus" NOT NULL DEFAULT 'PENDING',
    "demo_session_enabled" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_plans" ADD CONSTRAINT "pricing_plans_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
