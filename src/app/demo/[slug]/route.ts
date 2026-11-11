import { listDemoIndexParams } from "@/demos/registry";
import { respondToDemo } from "@/demos/respond";

/**
 * Documento HTML propio: un page.tsx heredaría el layout raíz
 * (CSS global, proveedores y chrome de GRG).
 */
export function generateStaticParams() {
  return listDemoIndexParams();
}

export const dynamicParams = true;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return respondToDemo(slug, []);
}
