import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const findUser = async (body) => {
  const userId = normalize(body?.userId);
  const email = normalize(body?.email)?.toLowerCase();
  const username = normalize(body?.username);

  if (userId) return prisma.user.findUnique({ where: { id: userId } });
  if (email) return prisma.user.findUnique({ where: { email } });
  if (username) return prisma.user.findUnique({ where: { username } });
  return null;
};

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId: params.id, userId: session.user.id },
  });
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const user = await findUser(body);
  if (!user) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  await prisma.conversationMember.upsert({
    where: {
      conversationId_userId: {
        conversationId: params.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      conversationId: params.id,
      userId: user.id,
      role: "MEMBER",
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId: params.id, userId: session.user.id },
  });
  if (!membership || membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const user = await findUser(body);
  const role = normalize(body?.role)?.toUpperCase();

  if (!user || !["ADMIN", "MEMBER"].includes(role)) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId: params.id,
        userId: user.id,
      },
    },
    data: { role },
  });

  return NextResponse.json({ ok: true });
}

