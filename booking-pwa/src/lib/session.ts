import { NextResponse } from "next/server";

export const SESSION_COOKIE = "master_session";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR,
  };
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export function readSessionToken(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}
