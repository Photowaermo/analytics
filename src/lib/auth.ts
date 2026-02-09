import { cookies } from "next/headers";

const COOKIE_NAME = "analytics_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Must be set in production
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET environment variable is required in production");
    }
    // Development fallback only
    return "dev-secret-do-not-use-in-production";
  }
  return secret;
}

function getPassword(): string {
  return process.env.AUTH_PASSWORD || "pw123";
}

export function verifyPassword(password: string): boolean {
  const correctPassword = getPassword();
  // Constant-time comparison to prevent timing attacks
  if (password.length !== correctPassword.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < password.length; i++) {
    result |= password.charCodeAt(i) ^ correctPassword.charCodeAt(i);
  }
  return result === 0;
}

// Create HMAC signature using Web Crypto API (works in Edge Runtime)
async function createSignature(data: string): Promise<string> {
  const secret = getAuthSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Buffer.from(signature).toString("hex");
}

// Verify HMAC signature
async function verifySignature(data: string, signature: string): Promise<boolean> {
  const expectedSignature = await createSignature(data);
  // Constant-time comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionToken(): Promise<string> {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + COOKIE_MAX_AGE * 1000,
  };
  const data = JSON.stringify(payload);
  const signature = await createSignature(data);
  const token = Buffer.from(data).toString("base64") + "." + signature;
  return token;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const [dataBase64, signature] = token.split(".");
    if (!dataBase64 || !signature) {
      return false;
    }

    const data = Buffer.from(dataBase64, "base64").toString("utf-8");

    // Verify signature
    const isValid = await verifySignature(data, signature);
    if (!isValid) {
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

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  return verifySessionToken(token);
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
