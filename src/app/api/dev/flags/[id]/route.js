import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { updateFeatureFlagById } from "@/controllers/devController";

export async function PATCH(request, { params }) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Flag invalida." }, { status: 400 });
  }

  const body = await request.json();
  const enabled = Boolean(body?.enabled);

  const record = await updateFeatureFlagById({
    id,
    enabled,
    userId: session.user.id,
  });

  return NextResponse.json(record);
}
