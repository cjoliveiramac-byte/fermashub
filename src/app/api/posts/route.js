import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

const normalize = (value) => (value || "").trim();

const sanitizeMediaType = (value) => {
  const input = normalize(value).toUpperCase();
  if (["IMAGE", "VIDEO", "FILE"].includes(input)) {
    return input;
  }
  return null;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (posts.length === 0) {
    return NextResponse.json([]);
  }

  const ids = posts.map((post) => post.id);
  const [likes, comments] = await Promise.all([
    prisma.like.findMany({ where: { postId: { in: ids } } }),
    prisma.comment.findMany({ where: { postId: { in: ids } } }),
  ]);

  const likesCount = likes.reduce((acc, like) => {
    acc[like.postId] = (acc[like.postId] || 0) + 1;
    return acc;
  }, {});

  const commentsCount = comments.reduce((acc, comment) => {
    acc[comment.postId] = (acc[comment.postId] || 0) + 1;
    return acc;
  }, {});

  const likedSet = new Set(
    session?.user
      ? likes
          .filter((like) => like.userId === session.user.id)
          .map((like) => like.postId)
      : []
  );

  const enriched = posts.map((post) => ({
    ...post,
    likesCount: likesCount[post.id] || 0,
    commentsCount: commentsCount[post.id] || 0,
    liked: likedSet.has(post.id),
  }));

  return NextResponse.json(enriched);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Apenas moderadores e developer podem publicar." },
      { status: 403 }
    );
  }

  const limit = rateLimit(`post:${session.user.id}`, 8, 60000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Limite de posts atingido. Aguarda um pouco." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const title = normalize(body?.title);
  const content = normalize(body?.content);
  const mediaUrl = normalize(body?.mediaUrl);
  const mediaType = sanitizeMediaType(body?.mediaType);

  if (!content && !mediaUrl) {
    return NextResponse.json(
      { error: "Conteúdo ou mídia são obrigatórios." },
      { status: 400 }
    );
  }

  const authorEmail = session.user.email || "";
  const authorName = session.user.name || authorEmail.split("@")[0] || "user";
  const authorUsername =
    session.user.username || authorEmail.split("@")[0] || "user";

  const post = await prisma.post.create({
    data: {
      title: title || null,
      content: content || "",
      mediaUrl: mediaUrl || null,
      mediaType,
      authorId: session.user.id,
      authorName,
      authorEmail,
      authorUsername,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
