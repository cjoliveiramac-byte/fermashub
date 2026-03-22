import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { reviewReportById } from "@/controllers/moderationController";

const normalize = (value) => (value || "").trim();

export async function POST(request, { params }) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer", "moderator"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json();
  const decision = normalize(body?.decision || "").toUpperCase();

  if (!decision) {
    return NextResponse.json(
      { error: "Decisao obrigatoria." },
      { status: 400 }
    );
  }

  const report = await reviewReportById({
    reportId: id,
    decision,
    userId: session.user.id,
  });

  if (!report) {
    return NextResponse.json(
      { error: "Denúncia não encontrada." },
      { status: 404 }
    );
  }

  return NextResponse.json(report);
}
