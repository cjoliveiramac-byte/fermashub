import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (notifications.length === 0) {
    return NextResponse.json([]);
  }

  const actorIds = Array.from(
    new Set(notifications.map((item) => item.actorId))
  );
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, username: true, image: true, email: true },
  });

  const actorMap = actors.reduce((acc, actor) => {
    acc[actor.id] = actor;
    return acc;
  }, {});

  return NextResponse.json(
    notifications.map((item) => ({
      ...item,
      actor: actorMap[item.actorId] || null,
    }))
  );
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = body?.id;

  if (id) {
    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  } else {
    await prisma.notification.updateMany({
      where: { recipientId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
