import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = normalize(searchParams.get("search"));

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { username: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      role: true,
      status: true,
    },
  });

  return NextResponse.json(users);
}
