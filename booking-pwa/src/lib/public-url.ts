/** Server-side origin for emails and webhooks. */
export function getServerAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

/** Canonical public origin for QR / share links (never loopback if possible). */
export function getPublicAppUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const loopback = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

  if (fromEnv && !loopback.test(fromEnv)) {
    return fromEnv;
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (!loopback.test(origin)) {
      return origin;
    }
  }

  return fromEnv || (typeof window !== "undefined" ? window.location.origin : "");
}

export function masterPublicPageUrl(slug: string): string {
  return `${getPublicAppUrl()}/m/${slug}`;
}
