import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const userId = normalize(body?.userId);
  const role = normalize(body?.role).toUpperCase();

  if (!userId || !["USER", "MODERATOR"].includes(role)) {
    return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await prisma.log.create({
    data: {
      userId: session.user.id,
      action: "ROLE_UPDATE",
      metadata: JSON.stringify({ targetId: userId, targetType: "USER", role }),
    },
  });

  return NextResponse.json({ id: user.id, role: user.role.toLowerCase() });
}
