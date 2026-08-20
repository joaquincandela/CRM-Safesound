import { apiSuccess } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiSuccess({ status: "ok", ts: new Date().toISOString() });
}
