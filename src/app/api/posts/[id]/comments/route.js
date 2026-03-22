import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

const normalize = (value) => (value || "").trim();

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);
  const post = await prisma.post.findUnique({ where: { id: params.id } });

  if (!post) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: "asc" },
  });

  if (comments.length === 0) {
    return NextResponse.json([]);
  }

  const commentIds = comments.map((comment) => comment.id);
  const likes = await prisma.commentLike.findMany({
    where: { commentId: { in: commentIds } },
  });

  const likesCount = likes.reduce((acc, like) => {
    acc[like.commentId] = (acc[like.commentId] || 0) + 1;
    return acc;
  }, {});

  const likedSet = new Set(
    session?.user
      ? likes
          .filter((like) => like.userId === session.user.id)
          .map((like) => like.commentId)
      : []
  );

  return NextResponse.json(
    comments.map((comment) => ({
      ...comment,
      likesCount: likesCount[comment.id] || 0,
      liked: likedSet.has(comment.id),
    }))
  );
}

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`comment:${session.user.id}`, 20, 60000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Limite de Comentários atingido. Aguarda um pouco." },
      { status: 429 }
    );
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const content = normalize(body?.content);

  if (!content) {
    return NextResponse.json(
      { error: "Comentário não pode estar vazio." },
      { status: 400 }
    );
  }

  const authorName =
    session.user.name || session.user.username || "utilizador";
  const authorUsername =
    session.user.username || session.user.email?.split("@")[0] || "user";

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: session.user.id,
      authorName,
      authorUsername,
      content,
    },
  });

  if (post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        recipientId: post.authorId,
        actorId: session.user.id,
        type: "COMMENT",
        postId: post.id,
        message: "comentou no teu post.",
      },
    });
  }

  return NextResponse.json(comment, { status: 201 });
}

