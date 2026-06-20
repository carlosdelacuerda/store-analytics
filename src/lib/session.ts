import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SessionPayload, verifySessionToken } from "./auth";

/**
 * Read and verify the current session from the request cookies.
 * Returns null if there is no valid session.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Require an authenticated session. Throws a Response-like error object
 * that API routes can catch and turn into a 401, or returns the session.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
