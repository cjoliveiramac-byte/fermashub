import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

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

  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Permissao insuficiente." }, { status: 403 });
  }

  const body = await request.json();
  const userId = body?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Utilizador obrigatorio." }, { status: 400 });
  }

  const existing = await prisma.groupMember.findFirst({
    where: { groupId: params.id, userId },
  });

  if (existing) {
    if (existing.status === "BANNED") {
      return NextResponse.json({ error: "Utilizador banido." }, { status: 403 });
    }
    return NextResponse.json(existing);
  }

  const member = await prisma.groupMember.create({
    data: {
      groupId: params.id,
      userId,
      role: "MEMBER",
    },
  });

  return NextResponse.json(member, { status: 201 });
}
