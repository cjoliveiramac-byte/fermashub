import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { getUserHistoryBasic } from "@/controllers/moderationController";

export async function GET(request, { params }) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer", "moderator"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Utilizador obrigatorio." },
      { status: 400 }
    );
  }

  const history = await getUserHistoryBasic(id);
  return NextResponse.json(history);
}
