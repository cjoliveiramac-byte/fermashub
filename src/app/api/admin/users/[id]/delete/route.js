import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  await prisma.post.deleteMany({ where: { authorId: params.id } });
  await prisma.comment.deleteMany({ where: { authorId: params.id } });
  await prisma.like.deleteMany({ where: { userId: params.id } });
  await prisma.commentLike.deleteMany({ where: { userId: params.id } });
  await prisma.follow.deleteMany({
    where: { OR: [{ followerId: params.id }, { followingId: params.id }] },
  });
  await prisma.notification.deleteMany({
    where: { OR: [{ recipientId: params.id }, { actorId: params.id }] },
  });
  await prisma.conversationMember.deleteMany({ where: { userId: params.id } });
  await prisma.message.updateMany({
    where: { senderId: params.id },
    data: { deletedAt: new Date(), deletedById: session.user.id, content: "" },
  });
  await prisma.messageReaction.deleteMany({ where: { userId: params.id } });
  await prisma.groupMember.deleteMany({ where: { userId: params.id } });
  await prisma.channelMessage.deleteMany({ where: { senderId: params.id } });
  await prisma.channelMessageReaction.deleteMany({
    where: { userId: params.id },
  });

  const user = await prisma.user.delete({ where: { id: params.id } });

  await prisma.log.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_DELETE_USER",
      metadata: JSON.stringify({ targetId: params.id, email: user.email }),
    },
  });

  return NextResponse.json({ ok: true });
}

