import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { revokeApiKeyById } from "@/controllers/devController";

export async function POST(request, { params }) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Chave invalida." }, { status: 400 });
  }

  const record = await revokeApiKeyById({ id, userId: session.user.id });
  return NextResponse.json(record);
}
