import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);
  const post = await prisma.post.findUnique({
    where: { id: params.id },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [likes, comments] = await Promise.all([
    prisma.like.count({ where: { postId: post.id } }),
    prisma.comment.count({ where: { postId: post.id } }),
  ]);

  const liked = session?.user
    ? !!(await prisma.like.findFirst({
        where: { postId: post.id, userId: session.user.id },
      }))
    : false;

  return NextResponse.json({
    ...post,
    likesCount: likes,
    commentsCount: comments,
    liked,
  });
}

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = post.authorId === session.user.id;
  const isModerator = ["developer", "moderator"].includes(session.user.role);
  if (!isOwner && !isModerator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.deleteMany({ where: { postId: post.id } });
  await prisma.like.deleteMany({ where: { postId: post.id } });
  await prisma.post.delete({ where: { id: post.id } });

  return NextResponse.json({ ok: true });
}
