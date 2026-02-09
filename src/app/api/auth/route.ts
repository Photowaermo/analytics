import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from "@/lib/rate-limit";
import {
  verifyPassword,
  createSessionToken,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "@/lib/auth";

function getClientIp(request: NextRequest): string {
  // In production behind a reverse proxy, use the first IP from x-forwarded-for
  // The reverse proxy should be configured to overwrite this header
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  // Fallback - in production this should not happen if properly configured
  return request.headers.get("cf-connecting-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Check rate limit
  const rateLimitStatus = checkRateLimit(ip);
  if (!rateLimitStatus.allowed) {
    const minutesRemaining = Math.ceil(
      rateLimitStatus.lockoutRemainingMs / 1000 / 60
    );
    return NextResponse.json(
      {
        success: false,
        error: `Zu viele Fehlversuche. Bitte warte ${minutesRemaining} Minuten.`,
        lockoutRemainingMs: rateLimitStatus.lockoutRemainingMs,
      },
      { status: 429 }
    );
  }

  // Parse body
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Ungültige Anfrage" },
      { status: 400 }
    );
  }

  const { password } = body;

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { success: false, error: "Passwort erforderlich" },
      { status: 400 }
    );
  }

  // Check password with constant-time comparison
  if (!verifyPassword(password)) {
    const result = recordFailedAttempt(ip);

    if (result.locked) {
      const minutesRemaining = Math.ceil(result.lockoutRemainingMs / 1000 / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Zu viele Fehlversuche. Bitte warte ${minutesRemaining} Minuten.`,
          lockoutRemainingMs: result.lockoutRemainingMs,
        },
        { status: 429 }
      );
    }

    const remaining = rateLimitStatus.remainingAttempts - 1;
    return NextResponse.json(
      {
        success: false,
        error: `Falsches Passwort. Noch ${remaining} Versuch${remaining === 1 ? "" : "e"}.`,
        remainingAttempts: remaining,
      },
      { status: 401 }
    );
  }

  // Password correct - clear rate limit and create signed session token
  clearRateLimit(ip);

  const sessionToken = await createSessionToken();

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
