import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { fetchModerationUsers } from "@/controllers/moderationController";

export async function GET(request) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer", "moderator"]);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const take = Number(searchParams.get("take") || "");
  const search = (searchParams.get("search") || "").trim();

  const users = await fetchModerationUsers({
    take: Number.isNaN(take) ? undefined : take,
    search: search || undefined,
  });

  return NextResponse.json(users);
}
