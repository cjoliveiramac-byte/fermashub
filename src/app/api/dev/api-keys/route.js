import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { fetchApiKeys, createApiKeyForUser } from "@/controllers/devController";

const normalize = (value) => (value || "").trim();

export async function GET() {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const keys = await fetchApiKeys();
  return NextResponse.json(keys);
}

export async function POST(request) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const body = await request.json();
  const name = normalize(body?.name);

  const result = await createApiKeyForUser({
    name: name || "Nova chave",
    userId: session.user.id,
  });

  return NextResponse.json(result, { status: 201 });
}
