import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "./auth.ts";

export interface RateLimitOptions {
  windowMs: number;
  maxGuest: number;
  maxAuthenticated: number;
  label: string;
}

interface BucketEntry {
  timestamps: number[];
}

/**
 * In-memory sliding-window rate limiter keyed by authenticated UID or client IP.
 * Designed for single-instance Node/Express runtimes; prunes expired buckets
 * periodically so memory stays bounded under burst traffic.
 */
export class SlidingWindowLimiter {
  private readonly buckets = new Map<string, BucketEntry>();
  private readonly maxBuckets: number;

  constructor(maxBuckets = 5000) {
    this.maxBuckets = maxBuckets;
  }

  public check(
    key: string,
    limit: number,
    windowMs: number,
    now = Date.now()
  ): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const cutoff = now - windowMs;
    let entry = this.buckets.get(key);
    if (!entry) {
      if (this.buckets.size >= this.maxBuckets) {
        this.prune(cutoff);
      }
      entry = { timestamps: [] };
      this.buckets.set(key, entry);
    }

    // Drop timestamps outside the sliding window
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

    if (entry.timestamps.length >= limit) {
      const oldest = entry.timestamps[0] ?? now;
      const retryAfterMs = Math.max(1000, oldest + windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: Math.max(0, limit - entry.timestamps.length),
      retryAfterSeconds: 0,
    };
  }

  public prune(cutoff: number): void {
    for (const [key, entry] of this.buckets.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
      if (entry.timestamps.length === 0) {
        this.buckets.delete(key);
      }
    }
  }

  public clear(): void {
    this.buckets.clear();
  }
}

/**
 * Tracks active concurrent sessions (e.g., WebSocket connections) per key.
 */
export class ConcurrencyGuard {
  private readonly counts = new Map<string, number>();

  public acquire(key: string, maxConcurrent: number): boolean {
    const current = this.counts.get(key) ?? 0;
    if (current >= maxConcurrent) return false;
    this.counts.set(key, current + 1);
    return true;
  }

  public release(key: string): void {
    const current = this.counts.get(key) ?? 0;
    if (current <= 1) {
      this.counts.delete(key);
    } else {
      this.counts.set(key, current - 1);
    }
  }

  public getCount(key: string): number {
    return this.counts.get(key) ?? 0;
  }
}

export function getClientIp(req: Pick<Request, "headers" | "socket">): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim().length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

export function createRateLimitMiddleware(
  limiter: SlidingWindowLimiter,
  options: RateLimitOptions
) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const isAuthenticated = Boolean(req.user?.uid);
    const key = isAuthenticated
      ? `${options.label}:uid:${req.user!.uid}`
      : `${options.label}:ip:${getClientIp(req)}`;
    const limit = isAuthenticated ? options.maxAuthenticated : options.maxGuest;

    const result = limiter.check(key, limit, options.windowMs);
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSeconds));
      return res.status(429).json({
        error: isAuthenticated
          ? `Too many ${options.label} requests. Please wait ${result.retryAfterSeconds}s and try again.`
          : `Preview rate limit reached for ${options.label}. Wait ${result.retryAfterSeconds}s or sign in with Google for higher limits.`,
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    next();
  };
}

/**
 * Verifies WebSocket Origin header against Host to mitigate cross-site WebSocket hijacking.
 * Allows requests with no Origin header (non-browser clients/health checks) or matching host.
 */
export function isAllowedWebSocketOrigin(
  originHeader: string | undefined,
  hostHeader: string | undefined
): boolean {
  if (!originHeader) return true;
  if (!hostHeader) return false;
  try {
    const parsedOrigin = new URL(originHeader);
    return parsedOrigin.host.toLowerCase() === hostHeader.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Trims and clamps an untrusted string input to a safe maximum character count.
 */
export function clampString(
  value: unknown,
  maxLength: number,
  fallback = ""
): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

export function sanitizeStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number
): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (out.length >= maxItems) break;
    const cleaned = clampString(item, maxItemLength);
    if (cleaned) out.push(cleaned);
  }
  return out;
}
