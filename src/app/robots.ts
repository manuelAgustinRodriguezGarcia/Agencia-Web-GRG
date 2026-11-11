import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /demo queda rastreable a propósito. Un Disallow impediría leer
      // noindex y nofollow (meta robots y X-Robots-Tag).
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
