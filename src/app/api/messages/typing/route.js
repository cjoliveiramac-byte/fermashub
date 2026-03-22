import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const conversationId = body?.conversationId;
  const typing = Boolean(body?.typing);

  if (!conversationId) {
    return NextResponse.json({ error: "ConversationId obrigatorio." }, { status: 400 });
  }

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  realtime.emit("typing", {
    conversationId,
    userId: session.user.id,
    typing,
  });

  return NextResponse.json({ ok: true });
}
