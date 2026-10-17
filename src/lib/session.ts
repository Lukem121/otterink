import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "admin_session";
export const SESSION_DAYS = 30;

/** Dev fallback so `npm run dev` works before any env vars are set. */
export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "admin";
}

/** Signing key: AUTH_SECRET if set, else derived from the password (changing it logs everyone out). */
async function key(): Promise<Uint8Array | null> {
  const base = process.env.AUTH_SECRET || adminPassword();
  if (!base) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`linkpage:${base}`));
  return new Uint8Array(digest);
}

export async function createSessionToken(): Promise<string> {
  const k = await key();
  if (!k) throw new Error("ADMIN_PASSWORD is not set");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(k);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const k = await key();
  if (!k) return false;
  try {
    const { payload } = await jwtVerify(token, k, { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
