import { Router, type IRouter, type Request, type Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import * as admin from "firebase-admin";

const router: IRouter = Router();

// ────────────────────────────────────────
// Firebase Admin initialisation
// ────────────────────────────────────────

let _firebaseApp: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App | null {
  if (_firebaseApp) return _firebaseApp;
  const projectId = process.env["FIREBASE_PROJECT_ID"];
  if (!projectId) return null;
  try {
    if (admin.apps.length > 0) {
      _firebaseApp = admin.apps[0] ?? null;
      return _firebaseApp;
    }
    const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      _firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
    } else {
      _firebaseApp = admin.initializeApp({ projectId });
    }
    return _firebaseApp;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────
// Supabase clients
// ────────────────────────────────────────

const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
const supabaseAnonKey =
  process.env["SUPABASE_ANON_KEY"] ?? process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";
const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

function getSupabaseClient(useServiceRole = false): SupabaseClient {
  const key = useServiceRole && supabaseServiceKey ? supabaseServiceKey : supabaseAnonKey;
  return createClient(supabaseUrl, key);
}

// ────────────────────────────────────────
// DB row shapes (narrow, never `any`)
// ────────────────────────────────────────

interface StudentRow {
  user_id: string;
  full_name: string;
  locale: string;
}

interface TeacherRow {
  user_id: string;
  display_name: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

// ────────────────────────────────────────
// Helper: derive role from DB (server-authoritative)
// ────────────────────────────────────────

type DbRole = "companion" | "explorer";

async function resolveRoleFromDb(
  supabase: SupabaseClient,
  userId: string,
  claimedUserType: "student" | "teacher",
): Promise<
  | { ok: true; role: DbRole; fullName: string; locale: string }
  | { ok: false; status: number; message: string }
> {
  if (claimedUserType === "teacher") {
    const { data, error } = await supabase
      .from("teachers")
      .select("user_id, display_name")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return {
        ok: false,
        status: 403,
        message: "No teacher profile found for this account. Please register as a teacher first.",
      };
    }

    const row = data as TeacherRow;
    return { ok: true, role: "companion", fullName: row.display_name, locale: "en" };
  }

  // Student / default
  const { data, error } = await supabase
    .from("students")
    .select("user_id, full_name, locale")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Fallback: the student row may not exist yet; return a safe default
    return { ok: true, role: "explorer", fullName: "User", locale: "en" };
  }

  const row = data as StudentRow;
  return { ok: true, role: "explorer", fullName: row.full_name, locale: row.locale ?? "en" };
}

// ────────────────────────────────────────
// Zod schemas
// ────────────────────────────────────────

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
  phoneNumber: z.string().min(5),
  action: z.enum(["send", "verify"]),
  code: z.string().optional(),
});

const firebaseLoginSchema = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
  userType: z.enum(["student", "teacher"]).optional(),
});

// ────────────────────────────────────────
// Routes
// ────────────────────────────────────────

function handleError(res: Response, error: unknown): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "Invalid input" },
    });
    return;
  }
  const message = error instanceof Error ? error.message : "Internal error";
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message } });
}

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const input = loginSchema.parse(req.body);
    const supabase = getSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_ERROR", message: authError?.message ?? "Authentication failed" },
      });
    }

    const userId = authData.user.id;

    // Derive role from DB — never trust client-supplied userType for privilege decisions
    const resolved = await resolveRoleFromDb(supabase, userId, input.userType);
    if (!resolved.ok) {
      return res.status(resolved.status).json({
        success: false,
        error: { code: "ROLE_MISMATCH", message: resolved.message },
      });
    }

    return res.json({
      success: true,
      data: {
        id: userId,
        email: authData.user.email ?? input.email,
        fullName: resolved.fullName,
        role: resolved.role,
        locale: resolved.locale,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/auth/register
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const input = registerSchema.parse(req.body);

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(503).json({
        success: false,
        error: { message: "Server not configured. Missing SUPABASE_URL or SERVICE_ROLE_KEY." },
      });
    }

    const supabase = getSupabaseClient(true);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName, user_type: input.userType },
    });

    if (authError || !authData.user) {
      return res.status(400).json({
        success: false,
        error: { code: "AUTH_ERROR", message: authError?.message ?? "Registration failed" },
      });
    }

    const userId = authData.user.id;

    if (input.userType === "student") {
      const { error: profileError } = await supabase.from("students").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        full_name: input.fullName,
        locale: input.locale,
      });
      if (profileError) {
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({
          success: false,
          error: { code: "PROFILE_ERROR", message: profileError.message },
        });
      }
    } else {
      const { error: profileError } = await supabase.from("teachers").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        display_name: input.displayName,
        bio: input.bio ?? "",
        city: input.city ?? "",
        country: input.country ?? "",
        languages_spoken: input.languagesSpoken,
        status: "PENDING",
      });
      if (profileError) {
        await supabase.auth.admin.deleteUser(userId);
        return res.status(400).json({
          success: false,
          error: { code: "PROFILE_ERROR", message: profileError.message },
        });
      }
    }

    return res.json({
      success: true,
      data: {
        id: userId,
        email: input.email,
        fullName: input.fullName,
        role: input.userType === "teacher" ? "companion" : "explorer",
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/auth/phone
router.post("/auth/phone", async (req: Request, res: Response) => {
  try {
    const input = phoneSchema.parse(req.body);

    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const authToken = process.env["TWILIO_AUTH_TOKEN"];
    const verifyServiceSid = process.env["TWILIO_VERIFY_SERVICE_SID"];

    if (!accountSid || !authToken || !verifyServiceSid) {
      return res.status(503).json({
        success: false,
        error: { message: "Phone auth (Twilio) is not configured on this server." },
      });
    }

    const cleanPhone = input.phoneNumber.replace(/[\s\-\(\)]/g, "");
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

    if (input.action === "send") {
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `To=${encodeURIComponent(formattedPhone)}&Channel=sms`,
        },
      );
      const twilioData = (await response.json()) as { status?: string; to?: string; message?: string };
      if (!response.ok) {
        return res.status(400).json({
          success: false,
          error: { message: twilioData.message ?? "Failed to send OTP" },
        });
      }
      return res.json({
        success: true,
        data: { status: twilioData.status, to: twilioData.to },
      });
    }

    if (input.action === "verify") {
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationChecks`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `To=${encodeURIComponent(formattedPhone)}&Code=${encodeURIComponent(input.code ?? "")}`,
        },
      );
      const twilioData = (await response.json()) as { status?: string; message?: string };
      if (!response.ok || twilioData.status !== "approved") {
        return res.status(400).json({
          success: false,
          error: { message: twilioData.message ?? "Invalid code" },
        });
      }
      return res.json({
        success: true,
        data: { id: crypto.randomUUID(), phone: formattedPhone, role: "explorer" },
      });
    }

    return res.status(400).json({ success: false, error: { message: "Invalid action" } });
  } catch (error) {
    handleError(res, error);
  }
});

// POST /api/auth/firebase-login
router.post("/auth/firebase-login", async (req: Request, res: Response) => {
  try {
    const input = firebaseLoginSchema.parse(req.body);

    // Step 1: Require and verify the Firebase ID token server-side
    const app = getFirebaseApp();
    if (!app) {
      return res.status(503).json({
        success: false,
        error: { message: "Firebase is not configured on this server. Set FIREBASE_PROJECT_ID." },
      });
    }

    let verifiedToken: admin.auth.DecodedIdToken;
    try {
      verifiedToken = await admin.auth(app).verifyIdToken(input.idToken);
    } catch {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Firebase ID token is invalid or expired." },
      });
    }

    // Step 2: Use verified token claims — never trust client-supplied fields for identity
    const email = verifiedToken.email;
    const displayName = (verifiedToken.name as string | undefined) ?? undefined;
    const photoURL = (verifiedToken.picture as string | undefined) ?? undefined;

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
      .select("id, email, full_name, role, avatar_url")
      .eq("email", email)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      return res.status(500).json({
        success: false,
        error: { message: "Database query failed: " + selectError.message },
      });
    }

    if (existingUser) {
      const row = existingUser as UserRow;
      await supabase
        .from("users")
        .update({
          full_name: displayName ?? row.full_name,
          avatar_url: photoURL ?? row.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      return res.json({
        success: true,
        data: {
          id: row.id,
          email: row.email,
          fullName: displayName ?? row.full_name,
          role: row.role,
          avatarUrl: photoURL ?? row.avatar_url,
        },
      });
    }

    // New user — create with role from DB schema, not from client input
    const userId = crypto.randomUUID();
    const role = input.userType === "teacher" ? "TEACHER" : "STUDENT";

    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email.trim().toLowerCase(),
        full_name: displayName ?? email.split("@")[0],
        avatar_url: photoURL ?? null,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, email, full_name, role, avatar_url")
      .single();

    if (createError || !newUser) {
      return res.status(500).json({
        success: false,
        error: { message: createError?.message ?? "Failed to create user." },
      });
    }

    const created = newUser as UserRow;
    return res.json({
      success: true,
      data: {
        id: created.id,
        email: created.email,
        fullName: created.full_name,
        role: created.role,
        avatarUrl: created.avatar_url,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

// GET /api/auth/google/callback
router.get("/auth/google/callback", (_req: Request, res: Response) => {
  res.json({ success: true, data: { message: "OAuth handled client-side" } });
});

export default router;
