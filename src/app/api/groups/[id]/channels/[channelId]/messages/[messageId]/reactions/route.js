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

  const membership = await prisma.groupMember.findFirst({
    where: { groupId: params.id, userId: session.user.id },
  });
  if (!membership || membership.status === "BANNED") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const emoji = normalize(body?.emoji);
  if (!emoji) {
    return NextResponse.json({ error: "Emoji obrigatorio." }, { status: 400 });
  }

  const existing = await prisma.channelMessageReaction.findFirst({
    where: {
      messageId: params.messageId,
      userId: session.user.id,
      emoji,
    },
  });

  if (existing) {
    await prisma.channelMessageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.channelMessageReaction.create({
      data: {
        messageId: params.messageId,
        userId: session.user.id,
        emoji,
      },
    });
  }

  const reactions = await prisma.channelMessageReaction.findMany({
    where: { messageId: params.messageId },
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
