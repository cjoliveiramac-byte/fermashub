import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";
import { rateLimit } from "@/lib/rateLimit";

const normalize = (value) => (value || "").trim();

const ensureMember = async (conversationId, userId, allowDeveloper) => {
  if (allowDeveloper) {
    return true;
  }
  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId },
  });
  return Boolean(membership);
};

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

  const isDeveloper = session.user.role === "developer";
  const canAccess = await ensureMember(
    params.id,
    session.user.id,
    isDeveloper
  );
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const take = Number(searchParams.get("take") || 50);
  const before = searchParams.get("before");
  const beforeDate = before ? new Date(before) : null;

  const where = {
    conversationId: params.id,
    ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
  };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(200, Math.max(1, take)),
  });

  const ids = messages.map((message) => message.id);
  const reactions = ids.length
    ? await prisma.messageReaction.findMany({
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

  if (!isDeveloper) {
    await prisma.message.updateMany({
      where: {
        conversationId: params.id,
        senderId: { not: session.user.id },
        deliveredAt: null,
      },
      data: { deliveredAt: new Date(), status: "DELIVERED" },
    });
  }

  return NextResponse.json(enriched);
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canAccess = await ensureMember(params.id, session.user.id, false);
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = rateLimit(`message:${session.user.id}`, 60, 60000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Limite de mensagens atingido. Aguarda um pouco." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const content = normalize(body?.content);
  const mediaUrl = normalize(body?.mediaUrl);
  const mediaType = sanitizeMediaType(body?.mediaType);
  const mediaName = normalize(body?.mediaName);

  if (!content && !mediaUrl) {
    return NextResponse.json(
      { error: "Mensagem vazia." },
      { status: 400 }
    );
  }

  const senderName =
    session.user.name || session.user.username || session.user.email || "user";

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      senderId: session.user.id,
      senderName,
      content: content || "",
      mediaUrl: mediaUrl || null,
      mediaType,
      mediaName: mediaName || null,
      status: "SENT",
    },
  });

  await prisma.conversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  const recipients = await prisma.conversationMember.findMany({
    where: { conversationId: params.id, userId: { not: session.user.id } },
  });

  if (recipients.length) {
    await prisma.notification.createMany({
      data: recipients.map((member) => ({
        recipientId: member.userId,
        actorId: session.user.id,
        type: "MESSAGE",
        message: "enviou-te uma mensagem.",
      })),
    });
  }

  realtime.emit("message", { conversationId: params.id, message });

  return NextResponse.json(message, { status: 201 });
}
