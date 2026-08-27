import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Proxy API calls to the FastAPI backend so the browser always talks to a
  // same-origin endpoint — eliminates CORS issues across dev hosts/ports.
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
  // Baseline hardening headers. Deliberately NO script-src CSP: Next.js and
  // Clerk rely on inline/bootstrap scripts that would break without a
  // nonce pipeline; these headers are strictly additive.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(self), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
