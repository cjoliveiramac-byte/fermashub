import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: params.id },
  });

  if (!comment) {
    return NextResponse.json(
      { error: "Comentário não encontrado." },
      { status: 404 }
    );
  }

  const existing = await prisma.commentLike.findFirst({
    where: { commentId: comment.id, userId: session.user.id },
  });

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.commentLike.create({
      data: { commentId: comment.id, userId: session.user.id },
    });
  }

  const likesCount = await prisma.commentLike.count({
    where: { commentId: comment.id },
  });

  return NextResponse.json({ liked: !existing, likesCount });
}

