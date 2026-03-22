import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { fetchReports } from "@/controllers/moderationController";

const normalize = (value) => (value || "").trim();

export async function GET(request) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer", "moderator"]);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const status = normalize(searchParams.get("status"));
  const type = normalize(searchParams.get("type"));
  const minPriority = Number(searchParams.get("priority") || "");

  const filters = {};
  if (status) filters.status = status.toUpperCase();
  if (type) filters.type = type.toUpperCase();
  if (!Number.isNaN(minPriority)) {
    filters.priority = { gte: minPriority };
  }

  const reports = await fetchReports(filters);
  return NextResponse.json(reports);
}
