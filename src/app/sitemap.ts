import type { MetadataRoute } from "next";

import { LEGAL_PATHS, SITE_URL } from "@/config/site";
import { isDemoPathname } from "@/demos/policy";
import { getAllProjectSlugs } from "@/lib/projects/projectBySlug";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${LEGAL_PATHS.privacy}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}${LEGAL_PATHS.terms}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}${LEGAL_PATHS.cookies}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const projectRoutes: MetadataRoute.Sitemap = getAllProjectSlugs().map(
    (slug) => ({
      url: `${SITE_URL}/proyectos/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  );

  const routes = [...staticRoutes, ...projectRoutes];

  for (const route of routes) {
    const pathname = new URL(route.url).pathname;
    if (isDemoPathname(pathname)) {
      throw new Error(
        `Las demos no pueden entrar al sitemap: ${route.url}`,
      );
    }
  }

  return routes;
}
