import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const emoji = normalize(body?.emoji);
  if (!emoji) {
    return NextResponse.json({ error: "Emoji obrigatorio." }, { status: 400 });
  }

  const message = await prisma.message.findUnique({ where: { id: params.id } });
  if (!message) {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId: message.conversationId, userId: session.user.id },
  });
  if (!membership && session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.messageReaction.findFirst({
    where: {
      messageId: params.id,
      userId: session.user.id,
      emoji,
    },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({
      data: {
        messageId: params.id,
        userId: session.user.id,
        emoji,
      },
    });
  }

  const reactions = await prisma.messageReaction.findMany({
    where: { messageId: params.id },
  });

  const grouped = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = acc[reaction.emoji] || [];
    acc[reaction.emoji].push(reaction.userId);
    return acc;
  }, {});

  const formatted = Object.entries(grouped).map(([key, userIds]) => ({
    emoji: key,
    count: userIds.length,
    userIds,
  }));

  return NextResponse.json({ reactions: formatted });
}

