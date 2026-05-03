import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let cachedLimiter: Ratelimit | null = null
let cachedDailyLimiter: Ratelimit | null = null

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function getLimiters(): { perMinute: Ratelimit; perDay: Ratelimit } | null {
  if (cachedLimiter && cachedDailyLimiter) {
    return { perMinute: cachedLimiter, perDay: cachedDailyLimiter }
  }
  const redis = getRedis()
  if (!redis) return null

  cachedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'rl:chat:min',
  })
  cachedDailyLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 d'),
    analytics: true,
    prefix: 'rl:chat:day',
  })
  return { perMinute: cachedLimiter, perDay: cachedDailyLimiter }
}

export type RateLimitResult =
  | { allowed: true; remaining: number; reset: number }
  | {
      allowed: false
      reason: 'minute' | 'day'
      remaining: number
      reset: number
      retryAfterSec: number
    }

export async function checkChatRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const limiters = getLimiters()
  if (!limiters) {
    return { allowed: true, remaining: -1, reset: 0 }
  }

  const minute = await limiters.perMinute.limit(identifier)
  if (!minute.success) {
    return {
      allowed: false,
      reason: 'minute',
      remaining: minute.remaining,
      reset: minute.reset,
      retryAfterSec: Math.max(1, Math.ceil((minute.reset - Date.now()) / 1000)),
    }
  }

  const day = await limiters.perDay.limit(identifier)
  if (!day.success) {
    return {
      allowed: false,
      reason: 'day',
      remaining: day.remaining,
      reset: day.reset,
      retryAfterSec: Math.max(1, Math.ceil((day.reset - Date.now()) / 1000)),
    }
  }

  return {
    allowed: true,
    remaining: Math.min(minute.remaining, day.remaining),
    reset: Math.min(minute.reset, day.reset),
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'anonymous'
}
