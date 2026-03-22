import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const sanitizeMediaType = (value) => {
  const input = normalize(value).toUpperCase();
  if (["IMAGE", "VIDEO", "FILE"].includes(input)) {
    return input;
  }
  return null;
};

export async function GET(request, { params }) {
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

  const { searchParams } = new URL(request.url);
  const take = Math.min(80, Math.max(1, Number(searchParams.get("take") || 40)));
  const before = searchParams.get("before");
  const beforeDate = before ? new Date(before) : null;

  const where = {
    channelId: params.channelId,
    ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
  };

  const messages = await prisma.channelMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
  });

  const ids = messages.map((message) => message.id);
  const reactions = ids.length
    ? await prisma.channelMessageReaction.findMany({
        where: { messageId: { in: ids } },
      })
    : [];

  const reactionMap = reactions.reduce((acc, reaction) => {
    acc[reaction.messageId] = acc[reaction.messageId] || {};
    acc[reaction.messageId][reaction.emoji] =
      acc[reaction.messageId][reaction.emoji] || [];
    acc[reaction.messageId][reaction.emoji].push(reaction.userId);
    return acc;
  }, {});

  const enriched = messages
    .reverse()
    .map((message) => {
      const grouped = reactionMap[message.id] || {};
      const formatted = Object.entries(grouped).map(([emoji, userIds]) => ({
        emoji,
        count: userIds.length,
        userIds,
      }));
      return { ...message, reactions: formatted };
    });

  return NextResponse.json(enriched);
}

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

  const channel = await prisma.channel.findUnique({
    where: { id: params.channelId },
  });
  if (!channel) {
    return NextResponse.json({ error: "Canal não encontrado." }, { status: 404 });
  }

  if (
    channel.type === "ANNOUNCEMENT" &&
    !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)
  ) {
    return NextResponse.json(
      { error: "Apenas moderadores podem publicar anuncios." },
      { status: 403 }
    );
  }

  if (membership.status === "MUTED" && membership.mutedUntil) {
    if (new Date(membership.mutedUntil) > new Date()) {
      return NextResponse.json(
        { error: "Estas silenciado neste grupo." },
        { status: 403 }
      );
    }
  }

  const body = await request.json();
  const content = normalize(body?.content);
  const mediaUrl = normalize(body?.mediaUrl);
  const mediaType = sanitizeMediaType(body?.mediaType);
  const mediaName = normalize(body?.mediaName);

  if (!content && !mediaUrl) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  const senderName =
    session.user.name || session.user.username || session.user.email || "user";

  const message = await prisma.channelMessage.create({
    data: {
      channelId: params.channelId,
      senderId: session.user.id,
      senderName,
      content: content || "",
      mediaUrl: mediaUrl || null,
      mediaType,
      mediaName: mediaName || null,
    },
  });

  return NextResponse.json(message, { status: 201 });
}

