import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "analytics_session";

// Paths that don't require authentication
const PUBLIC_PATHS = ["/auth", "/api/auth", "/health"];

// Verify token signature and expiration (Edge Runtime compatible)
async function verifySessionToken(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const [dataBase64, signature] = token.split(".");
    if (!dataBase64 || !signature) {
      return false;
    }

    const data = atob(dataBase64);

    // Create expected signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data)
    );
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    if (result !== 0) {
      return false;
    }

    // Check expiration
    const payload = JSON.parse(data);
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get auth secret
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("AUTH_SECRET environment variable is required");
      return new NextResponse("Server configuration error", { status: 500 });
    }
    // Development fallback
  }
  const authSecret = secret || "dev-secret-do-not-use-in-production";

  // Check for auth cookie
  const authCookie = request.cookies.get(COOKIE_NAME);

  if (!authCookie?.value) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Verify the session token
  const isValid = await verifySessionToken(authCookie.value, authSecret);

  if (!isValid) {
    // Clear invalid cookie and redirect to login
    const response = NextResponse.redirect(new URL("/auth", request.url));
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
