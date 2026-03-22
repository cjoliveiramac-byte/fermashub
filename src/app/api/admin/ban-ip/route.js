import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const ip = normalize(body?.ip);
  const reason = normalize(body?.reason) || "Sem motivo definido.";

  if (!ip) {
    return NextResponse.json({ error: "IP obrigatorio." }, { status: 400 });
  }

  const ban = await prisma.bannedIp.upsert({
    where: { ip },
    update: { reason, bannedById: session.user.id },
    create: {
      ip,
      reason,
      bannedById: session.user.id,
    },
  });

  await prisma.log.create({
    data: {
      userId: session.user.id,
      action: "BAN_IP",
      metadata: JSON.stringify({ targetId: ip, targetType: "IP", reason }),
    },
  });

  return NextResponse.json({ id: ban.id });
}
