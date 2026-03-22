import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { fetchUsers, createUserAccount } from "@/controllers/devController";

const normalize = (value) => (value || "").trim();

const ROLES = ["USER", "MODERATOR", "DEVELOPER"];

export async function GET(request) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const take = Number(searchParams.get("take") || "");
  const search = normalize(searchParams.get("search"));

  const users = await fetchUsers({
    take: Number.isNaN(take) ? undefined : take,
    search: search || undefined,
  });

  return NextResponse.json(users);
}

export async function POST(request) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const body = await request.json();
  const email = normalize(body?.email).toLowerCase();
  const name = normalize(body?.name);
  const password = body?.password || "";
  const role = normalize(body?.role || "USER").toUpperCase();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email e senha sao obrigatorios." },
      { status: 400 }
    );
  }

  if (!ROLES.includes(role)) {
    return NextResponse.json({ error: "Role invalida." }, { status: 400 });
  }

  if (role === "DEVELOPER") {
    const existingDev = await prisma.user.findFirst({
      where: { role: "DEVELOPER" },
    });
    if (existingDev) {
      return NextResponse.json(
        { error: "Já existe um developer registado." },
        { status: 409 }
      );
    }
  }

  try {
    const user = await createUserAccount({
      payload: { email, name, password, role },
      userId: session.user.id,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error?.code === "DUPLICATE_EMAIL") {
      return NextResponse.json(
        { error: "Email ja registado." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Falha ao criar utilizador." },
      { status: 500 }
    );
  }
}
