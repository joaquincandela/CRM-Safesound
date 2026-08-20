import { NextResponse } from "next/server";
import { parseBody, apiError } from "@/lib/api-helpers";
import * as service from "@/lib/services/auth.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const result = await service.login(body.email, body.password);
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
