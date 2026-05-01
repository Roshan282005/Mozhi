/*
  Warnings:

  - Added the required column `user_id` to the `learning_goals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "learning_goals" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "target_lessons" INTEGER,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "learning_goals_user_id_idx" ON "learning_goals"("user_id");

-- CreateIndex
CREATE INDEX "learning_goals_course_id_idx" ON "learning_goals"("course_id");

-- AddForeignKey
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
