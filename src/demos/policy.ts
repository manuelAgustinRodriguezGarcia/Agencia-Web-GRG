/** Valor único de las directivas robots para todas las respuestas bajo /demo. */
export const DEMO_ROBOTS_TAG = "noindex, nofollow";

export function isDemoPathname(pathname: string): boolean {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}
