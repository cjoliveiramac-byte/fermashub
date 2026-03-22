import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !["developer", "moderator"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const reason = normalize(body?.reason) || "Sem motivo definido.";
  const days = Number(body?.days || 0);

  if (!days || Number.isNaN(days) || days <= 0) {
    return NextResponse.json(
      { error: "NÃºmero de dias obrigatÃ³rio para suspensÃ£o." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  if (role === "moderator" && target.role !== "USER") {
    return NextResponse.json(
      { error: "Moderadores não podem suspender admins." },
      { status: 403 }
    );
  }

  const banExpiresAt = new Date(Date.now() + days * 86400000);

  const user = await prisma.user.update({
    where: { id: params.id },
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
      action: "ADMIN_SUSPEND_USER",
      metadata: JSON.stringify({
        targetId: params.id,
        reason,
        banExpiresAt,
      }),
    },
  });

  return NextResponse.json({ id: user.id, status: user.status, banExpiresAt });
}

