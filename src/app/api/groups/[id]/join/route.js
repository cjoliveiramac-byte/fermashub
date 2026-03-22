import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) {
    return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
  }

  if (!group.isPublic) {
    return NextResponse.json({ error: "Grupo privado." }, { status: 403 });
  }

  const existing = await prisma.groupMember.findFirst({
    where: { groupId: group.id, userId: session.user.id },
  });

  if (existing && existing.status === "BANNED") {
    return NextResponse.json({ error: "Acesso bloqueado." }, { status: 403 });
  }

  if (!existing) {
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: "MEMBER",
      },
    });
  }

  return NextResponse.json({ ok: true });
}

