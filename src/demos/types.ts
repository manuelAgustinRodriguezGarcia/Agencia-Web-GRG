/** Una pantalla de una demo. `segments` vacío es la portada `/demo/[slug]`. */
export type DemoPage = {
  segments: readonly string[];
  title: string;
  description: string;
  bodyHtml: string;
};

/**
 * Sitio de demostración independiente.
 * El CSS viaja solo dentro de su documento y no entra al bundle del sitio de GRG.
 */
export type DemoSite = {
  slug: string;
  css: string;
  pages: readonly DemoPage[];
};
