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
  const status = normalize(searchParams.get("status"));
  const type = normalize(searchParams.get("type"));
  const minPriority = Number(searchParams.get("priority") || "");

  const where = {};
  if (status) where.status = status.toUpperCase();
  if (type) where.type = type.toUpperCase();
  if (!Number.isNaN(minPriority)) {
    where.priority = { gte: minPriority };
  }

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const idsByType = reports.reduce(
    (acc, report) => {
      if (!acc[report.type]) acc[report.type] = new Set();
      acc[report.type].add(report.targetId);
      return acc;
    },
    { POST: new Set(), COMMENT: new Set(), MESSAGE: new Set(), USER: new Set() }
  );

  const [posts, comments, messages, users] = await Promise.all([
    idsByType.POST.size
      ? prisma.post.findMany({ where: { id: { in: Array.from(idsByType.POST) } } })
      : [],
    idsByType.COMMENT.size
      ? prisma.comment.findMany({
          where: { id: { in: Array.from(idsByType.COMMENT) } },
        })
      : [],
    idsByType.MESSAGE.size
      ? prisma.message.findMany({
          where: { id: { in: Array.from(idsByType.MESSAGE) } },
        })
      : [],
    idsByType.USER.size
      ? prisma.user.findMany({
          where: { id: { in: Array.from(idsByType.USER) } },
          select: { id: true, name: true, username: true, email: true },
        })
      : [],
  ]);

  const mapById = (items) =>
    items.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});

  const postMap = mapById(posts);
  const commentMap = mapById(comments);
  const messageMap = mapById(messages);
  const userMap = mapById(users);

  const enriched = reports.map((report) => {
    let target = null;
    if (report.type === "POST") {
      const post = postMap[report.targetId];
      target = post
        ? {
            id: post.id,
            label: post.title || "Post",
            excerpt: post.content?.slice(0, 80) || "",
          }
        : null;
    }
    if (report.type === "COMMENT") {
      const comment = commentMap[report.targetId];
      target = comment
        ? { id: comment.id, label: "Comentario", excerpt: comment.content?.slice(0, 80) || "" }
        : null;
    }
    if (report.type === "MESSAGE") {
      const message = messageMap[report.targetId];
      target = message
        ? { id: message.id, label: "Mensagem", excerpt: message.content?.slice(0, 80) || "" }
        : null;
    }
    if (report.type === "USER") {
      const user = userMap[report.targetId];
      target = user
        ? {
            id: user.id,
            label: user.name || user.username || "Utilizador",
            excerpt: user.email,
          }
        : null;
    }

    return { ...report, target };
  });

  return NextResponse.json(enriched);
}
