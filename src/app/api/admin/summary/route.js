import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [posts, users, reportsOpen] = await Promise.all([
    prisma.post.count(),
    prisma.user.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  return NextResponse.json({ posts, users, reportsOpen });
}
