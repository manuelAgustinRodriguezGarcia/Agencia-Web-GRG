import { respondDemoIndexMissing } from "@/demos/respond";

/** /demo no tiene catálogo público. */
export function GET() {
  return respondDemoIndexMissing();
}
