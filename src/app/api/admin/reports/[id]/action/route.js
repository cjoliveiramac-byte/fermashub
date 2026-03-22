import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const actionToStatus = (action) => {
  if (action === "REMOVE") return "DELETED";
  if (action === "WARN" || action === "BAN") return "APPROVED";
  if (action === "IGNORE") return "REJECTED";
  return "REVIEWING";
};

const warnUser = async ({ userId, actorId, reason }) => {
  if (!userId) return;
  await prisma.notification.create({
    data: {
      recipientId: userId,
      actorId,
      type: "SYSTEM",
      message: `Advertencia: ${reason || "Revise as regras da comunidade."}`,
    },
  });
};

const banUser = async ({ userId, actorId, reason }) => {
  if (!userId) return;
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "BANNED",
      bannedAt: new Date(),
      banReason: reason || "Violacao das regras.",
      bannedById: actorId,
    },
  });
};

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const action = normalize(body?.action).toUpperCase();
  const reason = normalize(body?.reason);

  if (!["REMOVE", "WARN", "BAN", "IGNORE"].includes(action)) {
    return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) {
    return NextResponse.json(
      { error: "Denúncia não encontrada." },
      { status: 404 }
    );
  }

  let targetUserId = null;

  if (report.type === "POST") {
    const post = await prisma.post.findUnique({ where: { id: report.targetId } });
    targetUserId = post?.authorId || null;
    if (action === "REMOVE" && post) {
      await prisma.post.delete({ where: { id: post.id } });
    }
  }

  if (report.type === "COMMENT") {
    const comment = await prisma.comment.findUnique({ where: { id: report.targetId } });
    targetUserId = comment?.authorId || null;
    if (action === "REMOVE" && comment) {
      await prisma.comment.delete({ where: { id: comment.id } });
    }
  }

  if (report.type === "MESSAGE") {
    const message = await prisma.message.findUnique({ where: { id: report.targetId } });
    targetUserId = message?.senderId || null;
    if (action === "REMOVE" && message) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          deletedAt: new Date(),
          deletedById: session.user.id,
          content: "",
        },
      });
    }
  }

  if (report.type === "USER") {
    targetUserId = report.targetId;
  }

  if (action === "WARN") {
    await warnUser({ userId: targetUserId, actorId: session.user.id, reason });
  }

  if (action === "BAN") {
    await banUser({ userId: targetUserId, actorId: session.user.id, reason });
  }

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      status: actionToStatus(action),
      resolvedAt: new Date(),
      resolvedById: session.user.id,
    },
  });

  await prisma.log.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_REPORT_ACTION",
      metadata: JSON.stringify({
        reportId: report.id,
        action,
        targetId: report.targetId,
        targetType: report.type,
        reason,
      }),
    },
  });

  return NextResponse.json(updated);
}
