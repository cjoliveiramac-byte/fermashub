import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !["developer", "moderator"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const userId = normalize(body?.userId);
  const reason = normalize(body?.reason) || "Sem motivo definido.";
  const days = Number(body?.days || 0);

  if (!userId) {
    return NextResponse.json({ error: "Utilizador obrigatorio." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  if (role === "moderator" && target.role !== "USER") {
    return NextResponse.json(
      { error: "Moderadores não podem banir admins." },
      { status: 403 }
    );
  }

  const banExpiresAt = days > 0 ? new Date(Date.now() + days * 86400000) : null;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: "BANNED",
      bannedAt: new Date(),
      banReason: reason,
      banExpiresAt,
      bannedById: session.user.id,
    },
  });

  await prisma.log.create({
    data: {
      userId: session.user.id,
      action: "BAN_USER",
      metadata: JSON.stringify({
        targetId: userId,
        targetType: "USER",
        reason,
        banExpiresAt,
      }),
    },
  });

  return NextResponse.json({ id: user.id, status: user.status });
}

