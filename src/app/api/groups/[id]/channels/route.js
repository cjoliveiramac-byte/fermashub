import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const sanitizeType = (value) => {
  const input = normalize(value).toUpperCase();
  if (["TEXT", "MEDIA", "ANNOUNCEMENT"].includes(input)) {
    return input;
  }
  return "TEXT";
};

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
  const name = normalize(body?.name);
  const type = sanitizeType(body?.type);

  if (!name) {
    return NextResponse.json({ error: "Nome obrigatorio." }, { status: 400 });
  }

  const channel = await prisma.channel.create({
    data: {
      groupId: params.id,
      name,
      type,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(channel, { status: 201 });
}
