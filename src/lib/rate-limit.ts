/**
 * Lightweight in-memory IP-based rate limiter.
 *
 * Scope: per Node.js process. With PM2 in cluster mode (4 workers) an
 * abuser's effective ceiling is roughly 4x the configured limit, which
 * is still adequate for the abuse patterns it defends against
 * (form spam, brute force, financial endpoint abuse).
 *
 * For multi-host scaling, swap this out for a Redis-backed limiter.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically prune expired entries to bound memory.
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let pruneScheduled = false;
function schedulePrune() {
  if (pruneScheduled) return;
  pruneScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(key);
    }
  }, PRUNE_INTERVAL_MS).unref?.();
}

export function getClientIp(req: Request | NextRequest): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("true-client-ip") ||
    "unknown"
  );
}

export interface RateLimitOptions {
  /** Bucket name — usually the route path. */
  key: string;
  /** Max allowed requests within `windowMs`. */
  limit: number;
  /** Window in milliseconds. */
  windowMs: number;
  /** Optional extra discriminator (e.g. email for forgot-password). */
  identifier?: string;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Check & consume one token. Returns { ok: false } when the caller is
 * over the limit. Callers should immediately short-circuit with a 429
 * (use `rateLimitResponse()`).
 */
export function rateLimit(
  req: Request | NextRequest,
  opts: RateLimitOptions,
): RateLimitResult {
  schedulePrune();
  const ip = getClientIp(req);
  const bucketKey = `${opts.key}:${ip}${opts.identifier ? `:${opts.identifier}` : ""}`;
  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + opts.windowMs });
    return {
      ok: true,
      remaining: opts.limit - 1,
      resetAt: now + opts.windowMs,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, opts.limit - existing.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    ok: existing.count <= opts.limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds,
  };
}

/**
 * Build a 429 Too Many Requests response with proper headers.
 */
export function rateLimitResponse(result: RateLimitResult, message?: string) {
  return NextResponse.json(
    { error: message || "Too many requests. Please slow down and try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
      },
    },
  );
}
