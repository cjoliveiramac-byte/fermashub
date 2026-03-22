import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";
import { rateLimit } from "@/lib/rateLimit";

const normalize = (value) => (value || "").trim();

const sanitizeMediaType = (value) => {
  const input = normalize(value).toUpperCase();
  if (["IMAGE", "VIDEO", "FILE"].includes(input)) {
    return input;
  }
  return null;
};

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const conversationId = normalize(body?.conversationId);
  if (!conversationId) {
    return NextResponse.json({ error: "ConversationId obrigatorio." }, { status: 400 });
  }

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = rateLimit(`message:${session.user.id}`, 60, 60000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Limite de mensagens atingido. Aguarda um pouco." },
      { status: 429 }
    );
  }

  const content = normalize(body?.content);
  const mediaUrl = normalize(body?.mediaUrl);
  const mediaType = sanitizeMediaType(body?.mediaType);
  const mediaName = normalize(body?.mediaName);

  if (!content && !mediaUrl) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  const senderName =
    session.user.name || session.user.username || session.user.email || "user";

  const message = await prisma.message.create({
    data: {
      conversationId,
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
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  const recipients = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { not: session.user.id } },
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

  realtime.emit("message", { conversationId, message });

  return NextResponse.json(message, { status: 201 });
}
