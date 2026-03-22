import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const messageId = body?.messageId;
  if (!messageId) {
    return NextResponse.json({ error: "MessageId obrigatorio." }, { status: 400 });
  }

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }

  if (message.senderId !== session.user.id && session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date(),
      deletedById: session.user.id,
      content: "",
    },
  });

  return NextResponse.json(updated);
}

