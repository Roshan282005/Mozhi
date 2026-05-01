import { Router, type IRouter, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router: IRouter = Router();

const supabaseUrl = process.env["SUPABASE_URL"] || process.env["NEXT_PUBLIC_SUPABASE_URL"] || "";
const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
const BUCKET_NAME = process.env["AWS_S3_BUCKET"] || "mozhi-videos";

router.post("/upload/video", async (req: Request, res: Response) => {
  try {
    const { action, fileName, fileType, lessonId, courseId } = req.body as {
      action?: string;
      fileName?: string;
      fileType?: string;
      lessonId?: string;
      courseId?: string;
    };

    if (action === "getSimpleUploadUrl") {
      if (!fileName || !fileType || !lessonId) {
        return res.status(400).json({
          success: false,
          error: { message: "Missing required fields: fileName, fileType, lessonId" },
        });
      }

      const key = `courses/${courseId || "general"}/lessons/${lessonId}/${Date.now()}-${fileName}`;
      const region = process.env["AWS_REGION"] || "ap-south-1";
      const videoUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

      return res.json({
        success: true,
        data: {
          key,
          videoUrl,
          uploadUrl: videoUrl + "?mock=true",
          message: "Configure AWS credentials for actual upload",
        },
      });
    }

    return res.status(400).json({ success: false, error: { message: "Invalid action" } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

router.put("/upload/video", async (req: Request, res: Response) => {
  try {
    const { lessonId, status, videoUrl } = req.body as {
      lessonId?: string;
      status?: string;
      videoUrl?: string;
    };

    if (status === "ready" && videoUrl && lessonId) {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("lessons")
          .update({ video_url: videoUrl, status: "PUBLISHED" })
          .eq("id", lessonId);
      }
      return res.json({ success: true });
    }

    return res.status(400).json({ success: false, error: { message: "Invalid request" } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
