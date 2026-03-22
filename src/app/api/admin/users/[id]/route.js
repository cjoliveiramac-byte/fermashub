import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      status: true,
      bio: true,
      website: true,
      location: true,
      createdAt: true,
      bannedAt: true,
      banReason: true,
      banExpiresAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  const [
    posts,
    reportsAgainst,
    reportsBy,
    logs,
    postsCount,
    commentsCount,
    messagesCount,
  ] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.report.findMany({
      where: { type: "USER", targetId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.report.count({ where: { reporterId: user.id } }),
    prisma.log.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.post.count({ where: { authorId: user.id } }),
    prisma.comment.count({ where: { authorId: user.id } }),
    prisma.message.count({ where: { senderId: user.id } }),
  ]);

  return NextResponse.json({
    user,
    posts,
    reportsAgainst,
    activity: {
      postsCount,
      commentsCount,
      messagesCount,
      reportsBy,
    },
    logs,
  });
}

