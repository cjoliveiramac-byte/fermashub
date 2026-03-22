import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { setPresence, getOnlineUsers } from "@/lib/presence";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  setPresence(session.user.id);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.conversationMember.findMany({
    where: { userId: session.user.id },
  });
  const conversationIds = memberships.map((member) => member.conversationId);

  const others = conversationIds.length
    ? await prisma.conversationMember.findMany({
        where: {
          conversationId: { in: conversationIds },
          userId: { not: session.user.id },
        },
      })
    : [];

  const userIds = Array.from(new Set(others.map((member) => member.userId)));
  const online = getOnlineUsers({ userIds });

  return NextResponse.json({ online });
}
