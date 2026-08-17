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

/**
 * Zwei Zugaenge mit unterschiedlichem Umfang:
 *   "admin"      — volles Dashboard, erreicht auch den Schnellanruf-Tab
 *   "speed_dial" — ausschliesslich der Schnellanruf-Tab, keine Admin-Seiten
 *
 * Der Schnellanruf wird von einer externen Person bedient, die keine Umsatz-
 * und Vertriebszahlen sehen soll — daher ein eigenes Passwort statt eines
 * geteilten.
 */
export type Role = "admin" | "speed_dial";

function getPassword(): string {
  return process.env.AUTH_PASSWORD || "pw123";
}

function getSpeedDialPassword(): string {
  return process.env.AUTH_PASSWORD_SPEED_DIAL || "go123";
}

function constantTimeEquals(a: string, b: string): boolean {
  // Laengenvergleich vorab ist unvermeidbar; der Rest laeuft zeitkonstant.
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Prueft das Passwort und liefert die zugehoerige Rolle, sonst null.
 * Beide Passwoerter werden immer geprueft, damit die Laufzeit nicht verraet,
 * welches der beiden getroffen wurde.
 */
export function verifyPasswordRole(password: string): Role | null {
  const istAdmin = constantTimeEquals(password, getPassword());
  const istSpeedDial = constantTimeEquals(password, getSpeedDialPassword());
  if (istAdmin) return "admin";
  if (istSpeedDial) return "speed_dial";
  return null;
}

export function verifyPassword(password: string): boolean {
  return verifyPasswordRole(password) !== null;
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

export async function createSessionToken(role: Role = "admin"): Promise<string> {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + COOKIE_MAX_AGE * 1000,
    role,
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

/** Rolle der aktuellen Sitzung, oder null wenn nicht angemeldet.
 *  Tokens von vor der Rollen-Einfuehrung gelten als "admin". */
export async function getSessionRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !(await verifySessionToken(token))) {
    return null;
  }
  try {
    const data = Buffer.from(token.split(".")[0], "base64").toString("utf-8");
    return JSON.parse(data).role === "speed_dial" ? "speed_dial" : "admin";
  } catch {
    return "admin";
  }
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
