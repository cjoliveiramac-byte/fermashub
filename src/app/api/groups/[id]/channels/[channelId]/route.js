import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request, { params }) {
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

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Permissao insuficiente." }, { status: 403 });
  }

  await prisma.channelMessage.deleteMany({
    where: { channelId: params.channelId },
  });

  const channel = await prisma.channel.delete({
    where: { id: params.channelId },
  });

  return NextResponse.json(channel);
}
