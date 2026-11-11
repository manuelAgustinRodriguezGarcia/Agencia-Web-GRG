import { cannatrolDemo } from "./cannatrol/cannatrolDemo";
import type { DemoPage, DemoSite } from "./types";

/**
 * Registro de demos servidas por URL.
 * Sumar una demo: crear su módulo y agregarlo aquí.
 * No enlazar estas rutas desde la navegación ni el sitemap.
 */
const demos: readonly DemoSite[] = [cannatrolDemo];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertRegistry(sites: readonly DemoSite[]): void {
  const slugs = new Set<string>();

  for (const site of sites) {
    if (!SLUG_PATTERN.test(site.slug)) {
      throw new Error(`Slug de demo inválido: ${site.slug}`);
    }
    if (slugs.has(site.slug)) {
      throw new Error(`Slug de demo duplicado: ${site.slug}`);
    }
    slugs.add(site.slug);

    if (!site.pages.some((page) => page.segments.length === 0)) {
      throw new Error(`La demo ${site.slug} no tiene portada`);
    }

    const paths = new Set<string>();
    for (const page of site.pages) {
      for (const segment of page.segments) {
        if (!SLUG_PATTERN.test(segment)) {
          throw new Error(
            `Segmento inválido en ${site.slug}: ${segment}`,
          );
        }
      }
      const key = page.segments.join("/");
      if (paths.has(key)) {
        throw new Error(`Ruta duplicada en ${site.slug}: /${key}`);
      }
      paths.add(key);
    }
  }
}

assertRegistry(demos);

export type DemoMatch = {
  site: DemoSite;
  page: DemoPage;
};

export function findDemoPage(
  slug: string,
  segments: readonly string[],
): DemoMatch | null {
  const site = demos.find((item) => item.slug === slug);
  if (!site) return null;

  const key = segments.join("/");
  const page = site.pages.find((item) => item.segments.join("/") === key);
  if (!page) return null;

  return { site, page };
}

export function listDemoIndexParams(): { slug: string }[] {
  return demos.map((site) => ({ slug: site.slug }));
}

export function listDemoNestedParams(): { slug: string; path: string[] }[] {
  return demos.flatMap((site) =>
    site.pages
      .filter((page) => page.segments.length > 0)
      .map((page) => ({
        slug: site.slug,
        path: [...page.segments],
      })),
  );
}
