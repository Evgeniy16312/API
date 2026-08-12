import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline",
  },
});

const extraOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ESM-safe project root (avoids picking parent monorepo lockfile as tracing root)
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  // LAN / Playwright: set ALLOWED_DEV_ORIGINS=192.168.0.105
  allowedDevOrigins: ["127.0.0.1", "localhost", ...extraOrigins],
  turbopack: {},
};

export default withPWA(nextConfig);
