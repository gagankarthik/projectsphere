import { cookies } from "next/headers";
import { verifyToken, decodeToken } from "./tokens";
import type { AuthUser, JWTPayload } from "@/types/auth";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const ID_TOKEN_COOKIE = "id_token";

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  idToken: string,
  expiresIn: number
) {
  const cookieStore = await cookies();

  const accessExpiry = new Date(Date.now() + expiresIn * 1000);
  const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: accessExpiry,
    path: "/",
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: refreshExpiry,
    path: "/",
  });

  cookieStore.set(ID_TOKEN_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: accessExpiry,
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(ID_TOKEN_COOKIE);
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || null;
}

export async function getIdToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ID_TOKEN_COOKIE)?.value || null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const idToken = await getIdToken();
  if (!idToken) return null;

  try {
    const payload = await verifyToken(idToken);
    return tokenPayloadToUser(payload);
  } catch {
    return null;
  }
}

export async function getCurrentUserFromRequest(request: Request): Promise<AuthUser | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const idToken = cookies[ID_TOKEN_COOKIE];
  if (!idToken) return null;

  try {
    const payload = await verifyToken(idToken);
    return tokenPayloadToUser(payload);
  } catch {
    return null;
  }
}

export function tokenPayloadToUser(payload: JWTPayload): AuthUser {
  // Always use payload.sub (Cognito sub) as the user ID
  // This matches how users are stored in the database via getOrCreateUser
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
  };
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

export function getAccessTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  return cookies[ACCESS_TOKEN_COOKIE] || null;
}

export function getRefreshTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  return cookies[REFRESH_TOKEN_COOKIE] || null;
}
