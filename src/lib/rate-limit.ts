// In-memory rate limiting for authentication attempts

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingMs: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // No entry yet - first attempt
  if (!entry) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutRemainingMs: 0,
    };
  }

  // Check if locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingMs: entry.lockedUntil - now,
    };
  }

  // Lockout expired - reset
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    rateLimitMap.delete(ip);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutRemainingMs: 0,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - entry.attempts,
    lockoutRemainingMs: 0,
  };
}

export function recordFailedAttempt(ip: string): {
  locked: boolean;
  lockoutRemainingMs: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { attempts: 1, lockedUntil: null });
    return { locked: false, lockoutRemainingMs: 0 };
  }

  const newAttempts = entry.attempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitMap.set(ip, { attempts: newAttempts, lockedUntil });
    return { locked: true, lockoutRemainingMs: LOCKOUT_DURATION_MS };
  }

  rateLimitMap.set(ip, { attempts: newAttempts, lockedUntil: null });
  return { locked: false, lockoutRemainingMs: 0 };
}

export function clearRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (entry.lockedUntil && now >= entry.lockedUntil) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);
