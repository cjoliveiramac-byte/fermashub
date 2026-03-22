import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const flags = await prisma.featureFlag.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(flags);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const name = normalize(body?.name);
  const enabled = Boolean(body?.enabled);

  if (!name) {
    return NextResponse.json({ error: "Nome obrigatorio." }, { status: 400 });
  }

  const record = await prisma.featureFlag.upsert({
    where: { name },
    update: { enabled },
    create: { name, enabled },
  });

  await prisma.log.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_FLAG_UPDATE",
      metadata: JSON.stringify({ name, enabled }),
    },
  });

  return NextResponse.json(record);
}
