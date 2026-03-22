import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { getModerationLogs } from "@/controllers/moderationController";

export async function GET() {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer", "moderator"]);
  if (forbidden) return forbidden;

  const logs = await getModerationLogs();
  return NextResponse.json(logs);
}
