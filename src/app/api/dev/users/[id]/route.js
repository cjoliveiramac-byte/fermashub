import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { roleMiddleware } from "@/middlewares/roleMiddleware";
import { updateUserAccount, deleteUserAccount } from "@/controllers/devController";

const normalize = (value) => (value || "").trim();
const ROLES = ["USER", "MODERATOR", "DEVELOPER"];
const STATUS = ["ACTIVE", "BANNED"];

export async function PATCH(request, { params }) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Utilizador invalido." },
      { status: 400 }
    );
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Não pode alterar o próprio utilizador." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const role = normalize(body?.role || "").toUpperCase();
  const status = normalize(body?.status || "").toUpperCase();
  const name = normalize(body?.name || "");
  const banReason = normalize(body?.banReason || "");
  const banDays = Number(body?.banDays || 0);

  const data = {};
  if (name) data.name = name;

  if (role) {
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: "Role invalida." }, { status: 400 });
    }
    if (role === "DEVELOPER") {
      const existingDev = await prisma.user.findFirst({
        where: { role: "DEVELOPER" },
      });
      if (existingDev && existingDev.id !== id) {
        return NextResponse.json(
          { error: "Já existe um developer registado." },
          { status: 409 }
        );
      }
    }
    data.role = role;
  }

  if (status) {
    if (!STATUS.includes(status)) {
      return NextResponse.json({ error: "Status invalido." }, { status: 400 });
    }
    if (status === "BANNED") {
      data.status = "BANNED";
      data.bannedAt = new Date();
      data.bannedById = session.user.id;
      data.banReason = banReason || "Sem motivo definido.";
      data.banExpiresAt =
        banDays > 0 ? new Date(Date.now() + banDays * 86400000) : null;
    } else {
      data.status = "ACTIVE";
      data.bannedAt = null;
      data.bannedById = null;
      data.banReason = null;
      data.banExpiresAt = null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nenhuma alteracao enviada." },
      { status: 400 }
    );
  }

  const user = await updateUserAccount({
    userId: id,
    data,
    actorId: session.user.id,
  });

  return NextResponse.json(user);
}

export async function DELETE(request, { params }) {
  const { session, response } = await authMiddleware();
  if (response) return response;
  const forbidden = roleMiddleware(session, ["developer"]);
  if (forbidden) return forbidden;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Utilizador invalido." },
      { status: 400 }
    );
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Não pode remover o próprio utilizador." },
      { status: 400 }
    );
  }

  const user = await deleteUserAccount({
    userId: id,
    actorId: session.user.id,
  });

  return NextResponse.json({ id: user.id });
}
