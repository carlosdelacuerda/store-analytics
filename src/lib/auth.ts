import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "session";
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day
const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  username: string;
}

/**
 * Sign a JWT containing the session payload.
 * @param payload User identity to embed in the token.
 * @param maxAgeSeconds Token lifetime in seconds.
 */
export async function signSessionToken(
  payload: SessionPayload,
  maxAgeSeconds: number
): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ userId: payload.userId, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(secretKey);
}

/**
 * Verify a session JWT, returning the decoded payload or null if invalid/expired.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.userId !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(rememberMe: boolean) {
  const maxAge = rememberMe ? REMEMBER_ME_MAX_AGE_SECONDS : DEFAULT_MAX_AGE_SECONDS;
  return {
    name: SESSION_COOKIE_NAME,
    maxAge,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge,
    },
  };
}

export { SESSION_COOKIE_NAME, DEFAULT_MAX_AGE_SECONDS, REMEMBER_ME_MAX_AGE_SECONDS };
