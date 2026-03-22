import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const content = normalize(body?.content);
  if (!content) {
    return NextResponse.json({ error: "ConteÃºdo obrigatÃ³rio." }, { status: 400 });
  }

  const message = await prisma.message.findUnique({ where: { id: params.id } });
  if (!message) {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }

  if (message.senderId !== session.user.id && session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.message.update({
    where: { id: params.id },
    data: { content, editedAt: new Date() },
  });

  return NextResponse.json(updated);
}

