import { Router, type IRouter, type Request, type Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import * as admin from "firebase-admin";

const router: IRouter = Router();

// Initialize Firebase Admin SDK (requires FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT env vars)
let firebaseApp: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App | null {
  if (firebaseApp) return firebaseApp;
  const projectId = process.env["FIREBASE_PROJECT_ID"];
  const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!projectId) return null;
  try {
    const existingApp = admin.apps.length > 0 ? admin.apps[0] : null;
    if (existingApp) {
      firebaseApp = existingApp;
      return firebaseApp;
    }
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
    } else {
      firebaseApp = admin.initializeApp({ projectId });
    }
    return firebaseApp;
  } catch {
    return null;
  }
}

const supabaseUrl = process.env["SUPABASE_URL"] || process.env["NEXT_PUBLIC_SUPABASE_URL"] || "";
const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"] || process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || "";
const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";

function getSupabaseClient(isAdmin = false): SupabaseClient {
  const key = isAdmin && supabaseServiceKey ? supabaseServiceKey : supabaseAnonKey;
  return createClient(supabaseUrl, key);
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  userType: z.enum(["student", "teacher"]).default("student"),
});

const studentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  userType: z.literal("student"),
  locale: z.string().default("en"),
});

const teacherSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  userType: z.literal("teacher"),
  displayName: z.string().min(2),
  bio: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  languagesSpoken: z.array(z.string()).default(["Tamil"]),
});

const registerSchema = z.discriminatedUnion("userType", [studentSchema, teacherSchema]);

const phoneSchema = z.object({
  phoneNumber: z.string(),
  action: z.enum(["send", "verify"]),
  code: z.string().optional(),
});

const firebaseLoginSchema = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  userType: z.enum(["student", "teacher"]).optional(),
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const supabase = getSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: authError.message },
      });
    }

    const userId = authData.user.id;
    const table = data.userType === "teacher" ? "teachers" : "students";
    const idField = data.userType === "teacher" ? "teacher_id" : "user_id";

    const { data: profile } = await supabase
      .from(table)
      .select("*")
      .eq(idField, userId)
      .single();

    const fullName =
      data.userType === "teacher"
        ? (profile as any)?.display_name
        : (profile as any)?.full_name || authData.user.user_metadata?.full_name || "User";

    return res.json({
      success: true,
      data: {
        id: userId,
        email: authData.user.email,
        fullName,
        role: data.userType === "teacher" ? "companion" : "explorer",
        locale: (profile as any)?.locale || "en",
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message },
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Internal error" },
    });
  }
});

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const supabase = getSupabaseClient(true);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, user_type: data.userType },
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        error: { code: "AUTH_ERROR", message: authError.message },
      });
    }

    const userId = authData.user.id;

    if (data.userType === "student") {
      const { error } = await supabase.from("students").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        full_name: data.fullName,
        locale: data.locale,
      });
      if (error) {
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({
          success: false,
          error: { code: "PROFILE_ERROR", message: error.message },
        });
      }
    } else {
      const { error } = await supabase.from("teachers").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        display_name: data.displayName,
        bio: data.bio || "",
        city: data.city || "",
        country: data.country || "",
        languages_spoken: data.languagesSpoken,
        status: "PENDING",
      });
      if (error) {
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({
          success: false,
          error: { code: "PROFILE_ERROR", message: error.message },
        });
      }
    }

    return res.json({
      success: true,
      data: {
        id: userId,
        email: data.email,
        fullName: data.fullName,
        role: data.userType === "teacher" ? "companion" : "explorer",
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message },
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Internal error" },
    });
  }
});

router.post("/auth/phone", async (req: Request, res: Response) => {
  try {
    const { phoneNumber, action, code } = phoneSchema.parse(req.body);

    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const authToken = process.env["TWILIO_AUTH_TOKEN"];
    const verifyServiceSid = process.env["TWILIO_VERIFY_SERVICE_SID"];

    if (!accountSid || !authToken || !verifyServiceSid) {
      return res.status(503).json({
        success: false,
        error: { message: "Phone auth (Twilio) is not configured on this server." },
      });
    }

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith("+")) {
      if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
        formattedPhone = "+" + cleanPhone;
      } else if (cleanPhone.length === 10) {
        formattedPhone = "+91" + cleanPhone;
      } else {
        formattedPhone = "+" + cleanPhone;
      }
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    if (action === "send") {
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `To=${formattedPhone}&Channel=sms`,
        },
      );
      const twilioData = await response.json() as any;
      if (!response.ok) {
        return res.status(400).json({
          success: false,
          error: { message: twilioData.message || "Failed to send OTP" },
        });
      }
      return res.json({
        success: true,
        data: { status: twilioData.status, to: twilioData.to },
      });
    }

    if (action === "verify") {
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationChecks`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `To=${formattedPhone}&Code=${code}`,
        },
      );
      const twilioData = await response.json() as any;
      if (!response.ok || twilioData.status !== "approved") {
        return res.status(400).json({
          success: false,
          error: { message: twilioData.message || "Invalid code" },
        });
      }
      return res.json({
        success: true,
        data: { id: crypto.randomUUID(), phone: formattedPhone, role: "explorer" },
      });
    }

    return res.status(400).json({ success: false, error: { message: "Invalid action" } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message },
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Internal error" },
    });
  }
});

router.post("/auth/firebase-login", async (req: Request, res: Response) => {
  try {
    const body = firebaseLoginSchema.parse(req.body);
    const { idToken, userType } = body;

    // Require and verify the Firebase ID token server-side
    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: { code: "MISSING_TOKEN", message: "Firebase ID token is required." },
      });
    }

    const app = getFirebaseApp();
    if (!app) {
      return res.status(503).json({
        success: false,
        error: { message: "Firebase is not configured on this server. Set FIREBASE_PROJECT_ID." },
      });
    }

    let verifiedToken: admin.auth.DecodedIdToken;
    try {
      verifiedToken = await admin.auth(app).verifyIdToken(idToken);
    } catch (tokenError: any) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Firebase ID token is invalid or expired." },
      });
    }

    // Use token claims — never trust client-supplied email/name directly
    const email = verifiedToken.email;
    const displayName = verifiedToken.name || body.displayName;
    const photoURL = verifiedToken.picture || body.photoURL;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_EMAIL", message: "Firebase token does not include an email address." },
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(503).json({
        success: false,
        error: { message: "Server not configured. Missing SUPABASE_URL or SERVICE_ROLE_KEY." },
      });
    }

    const supabase = getSupabaseClient(true);

    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      return res.status(500).json({
        success: false,
        error: { message: "Database query failed: " + selectError.message },
      });
    }

    if (existingUser) {
      await supabase
        .from("users")
        .update({
          full_name: displayName || (existingUser as any).full_name,
          avatar_url: photoURL || (existingUser as any).avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", (existingUser as any).id);

      return res.json({
        success: true,
        data: {
          id: (existingUser as any).id,
          email: (existingUser as any).email,
          fullName: (existingUser as any).full_name,
          role: (existingUser as any).role,
          avatarUrl: (existingUser as any).avatar_url,
        },
      });
    }

    const userId = crypto.randomUUID();
    const role = userType === "teacher" ? "TEACHER" : "STUDENT";

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email.trim().toLowerCase(),
        full_name: displayName || email.split("@")[0],
        avatar_url: photoURL || null,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      return res.status(500).json({
        success: false,
        error: { message: createError.message || "Failed to create user." },
      });
    }

    return res.json({
      success: true,
      data: {
        id: (newUser as any)?.id,
        email: (newUser as any)?.email,
        fullName: (newUser as any)?.full_name,
        role: (newUser as any)?.role,
        avatarUrl: (newUser as any)?.avatar_url,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message },
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: error.message || "Internal error" },
    });
  }
});

router.get("/auth/google/callback", (_req: Request, res: Response) => {
  res.json({ success: true, data: { message: "OAuth handled client-side" } });
});

export default router;
