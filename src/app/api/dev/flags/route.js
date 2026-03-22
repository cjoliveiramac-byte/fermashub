import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import {
  fetchFeatureFlags,
  upsertFeatureFlagByName,
} from "@/controllers/devController";

const normalize = (value) => (value || "").trim();

export async function GET() {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const flags = await fetchFeatureFlags();
  return NextResponse.json(flags);
}

export async function POST(request) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const body = await request.json();
  const name = normalize(body?.name);
  const enabled = Boolean(body?.enabled);

  if (!name) {
    return NextResponse.json({ error: "Nome obrigatorio." }, { status: 400 });
  }

  const record = await upsertFeatureFlagByName({
    name,
    enabled,
    userId: session.user.id,
  });
  return NextResponse.json(record, { status: 201 });
}
