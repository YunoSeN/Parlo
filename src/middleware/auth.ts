import { NextFunction, Request, Response } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "../lib/firebase-admin.ts";

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

/**
 * Attaches req.user when a valid Firebase Bearer token is provided, without
 * blocking guest preview users who are not signed in.
 */
export const attachOptionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) return next();

  try {
    req.user = await adminAuth.verifyIdToken(token);
  } catch {
    // Treat expired/invalid optional tokens as anonymous guest rather than failing
  }
  next();
};

