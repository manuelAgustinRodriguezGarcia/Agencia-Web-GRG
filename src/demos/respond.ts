import { NextResponse } from "next/server";

import { DEMO_ROBOTS_TAG } from "./policy";
import { findDemoPage } from "./registry";
import type { DemoPage, DemoSite } from "./types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function embedCss(css: string): string {
  return css.replace(/<\/style/gi, "<\\/style");
}

function renderDocument(options: {
  title: string;
  description?: string;
  css?: string;
  bodyHtml: string;
  slug?: string;
}): string {
  const slugAttribute =
    options.slug !== undefined
      ? ` data-demo="${escapeHtml(options.slug)}"`
      : "";
  const description = options.description
    ? `<meta name="description" content="${escapeHtml(options.description)}">`
    : "";
  const css = options.css ? `<style>${embedCss(options.css)}</style>` : "";

  return `<!DOCTYPE html>
<html lang="es"${slugAttribute}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="${escapeHtml(DEMO_ROBOTS_TAG)}">
<title>${escapeHtml(options.title)}</title>
${description}
${css}
</head>
<body>
${options.bodyHtml}
</body>
</html>`;
}

function renderDemoDocument(site: DemoSite, page: DemoPage): string {
  return renderDocument({
    title: page.title,
    description: page.description,
    css: site.css,
    bodyHtml: page.bodyHtml,
    slug: site.slug,
  });
}

function renderMissingDemoDocument(): string {
  return renderDocument({
    title: "No encontrado",
    bodyHtml: `<main>
  <h1>No encontrado</h1>
  <p>No hay una demo en esta dirección.</p>
</main>`,
  });
}

function htmlResponse(html: string, status: number): NextResponse {
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": DEMO_ROBOTS_TAG,
    },
  });
}

export function respondToDemo(
  slug: string,
  segments: readonly string[],
): NextResponse {
  const match = findDemoPage(slug, segments);
  if (!match) {
    return htmlResponse(renderMissingDemoDocument(), 404);
  }
  return htmlResponse(renderDemoDocument(match.site, match.page), 200);
}

export function respondDemoIndexMissing(): NextResponse {
  return htmlResponse(renderMissingDemoDocument(), 404);
}
