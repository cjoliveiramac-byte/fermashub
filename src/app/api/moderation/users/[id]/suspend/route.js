import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { suspendUserById } from "@/controllers/moderationController";

const normalize = (value) => (value || "").trim();

export async function POST(request, { params }) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer", "moderator"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json();
  const reason = normalize(body?.reason) || "Sem motivo definido.";
  const days = Number(body?.days || 0);

  if (!id) {
    return NextResponse.json(
      { error: "Utilizador obrigatorio." },
      { status: 400 }
    );
  }

  const result = await suspendUserById({
    userId: id,
    reason,
    days,
    actionUserId: session.user.id,
  });

  return NextResponse.json({ id: result.id, status: result.status });
}
