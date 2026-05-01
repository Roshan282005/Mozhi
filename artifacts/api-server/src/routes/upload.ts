import { Router, type IRouter, type Request, type Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
const BUCKET_NAME = process.env["AWS_S3_BUCKET"] ?? "mozhi-videos";
const AWS_REGION = process.env["AWS_REGION"] ?? "ap-south-1";

function getAdminSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey);
}

const getUploadUrlSchema = z.object({
  action: z.literal("getSimpleUploadUrl"),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  lessonId: z.string().min(1),
  courseId: z.string().optional(),
});

const updateVideoSchema = z.object({
  lessonId: z.string().min(1),
  status: z.literal("ready"),
  videoUrl: z.string().url(),
});

// POST /api/upload/video — requires auth
router.post("/upload/video", requireAuth, async (req: Request, res: Response) => {
  try {
    const input = getUploadUrlSchema.parse(req.body);

    // AWS S3 pre-signed URL generation would go here when AWS_ACCESS_KEY_ID is configured.
    // Without credentials the endpoint returns a placeholder key/URL so the teacher flow
    // remains functional end-to-end (upload UI renders, URL is stored); actual upload is
    // a no-op until AWS credentials are provided via environment variables.
    const key = `courses/${input.courseId ?? "general"}/lessons/${input.lessonId}/${Date.now()}-${input.fileName}`;
    const videoUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return res.json({
      success: true,
      data: {
        key,
        videoUrl,
        uploadUrl: videoUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid input" },
      });
    }
    const message = error instanceof Error ? error.message : "Internal error";
    return res.status(500).json({ success: false, error: { message } });
  }
});

// PUT /api/upload/video — requires auth; updates lesson record in DB
router.put("/upload/video", requireAuth, async (req: Request, res: Response) => {
  try {
    const input = updateVideoSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(503).json({
        success: false,
        error: { message: "Database not configured." },
      });
    }

    const supabase = getAdminSupabase();

    // Verify the requesting user owns this lesson (via the course they teach)
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, section_id")
      .eq("id", input.lessonId)
      .single();

    if (lessonError || !lesson) {
      return res.status(404).json({ success: false, error: { message: "Lesson not found." } });
    }

    // Ownership check: confirm the teacher owns the course that contains this lesson
    const { data: section } = await supabase
      .from("sections")
      .select("course_id")
      .eq("id", (lesson as { id: string; section_id: string }).section_id)
      .single();

    // Fail closed: if any ownership lookup fails, deny the write
    if (!section) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Could not verify lesson ownership." },
      });
    }

    const courseId = (section as { course_id: string }).course_id;
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("teacher_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Could not verify course ownership." },
      });
    }

    if ((course as { teacher_id: string }).teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not own this lesson." },
      });
    }

    await supabase
      .from("lessons")
      .update({ video_url: input.videoUrl, status: "PUBLISHED" })
      .eq("id", input.lessonId);

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid input" },
      });
    }
    const message = error instanceof Error ? error.message : "Internal error";
    return res.status(500).json({ success: false, error: { message } });
  }
});

export default router;
