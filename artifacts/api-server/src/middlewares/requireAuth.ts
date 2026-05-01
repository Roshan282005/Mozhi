import { type Request, type Response, type NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"] ?? process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
const supabaseAnonKey =
  process.env["SUPABASE_ANON_KEY"] ?? process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Missing auth token" } });
    return;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(503).json({ success: false, error: { code: "NOT_CONFIGURED", message: "Auth service not configured" } });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } });
    return;
  }

  (req as AuthenticatedRequest).userId = data.user.id;
  next();
}
