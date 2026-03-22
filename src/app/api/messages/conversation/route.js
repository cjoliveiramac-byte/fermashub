import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    const membership = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: session.user.id },
    });
    if (!membership && session.user.role !== "developer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const take = Math.min(120, Math.max(1, Number(searchParams.get("take") || 60)));
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take,
    });

    const members = await prisma.conversationMember.findMany({
      where: { conversationId },
    });
    const userIds = Array.from(new Set(members.map((member) => member.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true, image: true, email: true },
    });

    return NextResponse.json({ messages, members, users });
  }

  const memberships = await prisma.conversationMember.findMany({
    where: { userId: session.user.id },
  });
  const conversationIds = memberships.map((member) => member.conversationId);
  if (conversationIds.length === 0) {
    return NextResponse.json([]);
  }

  const conversations = await prisma.conversation.findMany({
    where: { id: { in: conversationIds } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}
