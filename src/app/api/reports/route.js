import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

const normalize = (value) => (value || "").trim();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(reports);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`report:${session.user.id}`, 6, 60000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Limite de denúncias atingido. Aguarda um pouco." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const type = normalize(body?.type || "POST").toUpperCase();
  const targetId = normalize(body?.targetId);
  const reason = normalize(body?.reason);
  const priority = Number(body?.priority || 0);

  if (!targetId || !reason) {
    return NextResponse.json(
      { error: "Dados de denúncia incompletos." },
      { status: 400 }
    );
  }

  const report = await prisma.report.create({
    data: {
      reporterId: session.user.id,
      type,
      targetId,
      reason,
      priority,
    },
  });

  const staff = await prisma.user.findMany({
    where: { role: { in: ["DEVELOPER", "MODERATOR"] } },
    select: { id: true },
  });

  if (staff.length > 0) {
    await prisma.notification.createMany({
      data: staff.map((member) => ({
        recipientId: member.id,
        actorId: session.user.id,
        type: "SYSTEM",
        message: `Nova denúncia (${type})`,
      })),
    });
  }

  return NextResponse.json(report, { status: 201 });
}
