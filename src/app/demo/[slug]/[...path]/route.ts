import { listDemoNestedParams } from "@/demos/registry";
import { respondToDemo } from "@/demos/respond";

export function generateStaticParams() {
  return listDemoNestedParams();
}

export const dynamicParams = true;

type RouteContext = {
  params: Promise<{ slug: string; path: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug, path } = await context.params;
  return respondToDemo(slug, path);
}
