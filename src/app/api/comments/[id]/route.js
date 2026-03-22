import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: params.id },
  });
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = comment.authorId === session.user.id;
  const isModerator = ["developer", "moderator"].includes(session.user.role);
  if (!isOwner && !isModerator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.commentLike.deleteMany({ where: { commentId: comment.id } });
  await prisma.comment.delete({ where: { id: comment.id } });

  return NextResponse.json({ ok: true });
}
