import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  const existing = await prisma.like.findFirst({
    where: { postId: post.id, userId: session.user.id },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { postId: post.id, userId: session.user.id },
    });

    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: session.user.id,
          type: "LIKE",
          postId: post.id,
          message: "gostou do teu post.",
        },
      });
    }
  }

  const likesCount = await prisma.like.count({ where: { postId: post.id } });
  return NextResponse.json({ liked: !existing, likesCount });
}

