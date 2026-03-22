import { NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { fetchCollectionData } from "@/controllers/devController";

const normalize = (value) => (value || "").trim();

export async function POST(request) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const body = await request.json();
  const collection = normalize(body?.collection).toLowerCase();
  const take = Number(body?.take || 20);
  let where = body?.where;

  if (!collection) {
    return NextResponse.json(
      { error: "Colecao obrigatoria." },
      { status: 400 }
    );
  }

  if (typeof where === "string") {
    try {
      where = JSON.parse(where);
    } catch {
      return NextResponse.json(
        { error: "Filtro JSON invalido." },
        { status: 400 }
      );
    }
  }

  const data = await fetchCollectionData({
    collection,
    where: where || {},
    take: Number.isNaN(take) ? 20 : take,
  });

  return NextResponse.json(data);
}
