import type { NextConfig } from "next";

import { DEMO_ROBOTS_TAG } from "./src/demos/policy";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    // Sin handlers unload: evita deprecaciones, mejora bfcache (Chrome).
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), unload=()",
  },
];

const demoRobotsHeaders = [
  { key: "X-Robots-Tag", value: DEMO_ROBOTS_TAG },
];

const nextConfig: NextConfig = {
  images: {
    // Next 16 solo permite valores listados; el portfolio usa quality={72}.
    qualities: [72, 75],
    // En dev no retener variantes optimizadas al reemplazar archivos en `public/`.
    minimumCacheTTL: isDev ? 0 : undefined,
    localPatterns: [
      {
        // Capturas del portfolio (`?v=` para invalidar caché al reemplazar assets).
        pathname: "/projects/**",
      },
      {
        pathname: "/team/**",
      },
      { pathname: "/work-with-us/**", search: "" },
      { pathname: "/logo.svg", search: "" },
      { pathname: "/logo-negro.svg", search: "" },
      // Hero banner en raíz de `public/` (admite `?v=` vía publicAssetUrl).
      { pathname: "/GRG-banner.webp" },
      // Ilustraciones 3D del Hero (visual stage + cards).
      { pathname: "/banner.png" },
      { pathname: "/banner-dark.png" },
      { pathname: "/admin.png" },
      { pathname: "/impulsamos.png" },
      { pathname: "/facturacion.png" },
      { pathname: "/ecommerce.png" },
      { pathname: "/landing.png" },
      { pathname: "/hero/services/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/demo",
        headers: demoRobotsHeaders,
      },
      {
        source: "/demo/:path*",
        headers: demoRobotsHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon.svg",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
