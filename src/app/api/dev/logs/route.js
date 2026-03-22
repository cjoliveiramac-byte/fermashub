import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { fetchLogs } from "@/controllers/devController";

export async function GET(request) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const action = (searchParams.get("action") || "").trim();
  const userId = (searchParams.get("userId") || "").trim();

  const logs = await fetchLogs({
    action: action || undefined,
    userId: userId || undefined,
  });
  return NextResponse.json(logs);
}
