import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = normalize(searchParams.get("search"));
  const take = Number(searchParams.get("take") || 50);

  const where = search
    ? {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
          { username: { contains: search } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, Number.isNaN(take) ? 50 : take)),
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
      bannedAt: true,
      banReason: true,
      banExpiresAt: true,
    },
  });

  return NextResponse.json(users);
}
