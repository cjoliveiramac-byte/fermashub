import { prisma } from "@/lib/prisma";

export const listReports = async (filters = {}) =>
  prisma.report.findMany({
    where: filters,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

export const listModerationUsers = async ({ take, search } = {}) => {
  const where = {
    role: { not: "DEVELOPER" },
    ...(search
      ? {
          OR: [
          { email: { contains: search } },
          { name: { contains: search } },
          { username: { contains: search } },
          ],
        }
      : {}),
  };

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, take || 50)),
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      status: true,
      bannedAt: true,
      banReason: true,
      banExpiresAt: true,
      createdAt: true,
    },
  });
};

const deleteTarget = async (report) => {
  switch (report.type) {
    case "POST":
      await prisma.comment.deleteMany({ where: { postId: report.targetId } });
      await prisma.like.deleteMany({ where: { postId: report.targetId } });
      await prisma.post.delete({ where: { id: report.targetId } });
      break;
    case "COMMENT":
      await prisma.commentLike.deleteMany({
        where: { commentId: report.targetId },
      });
      await prisma.comment.delete({ where: { id: report.targetId } });
      break;
    case "MESSAGE":
      await prisma.message.delete({ where: { id: report.targetId } });
      break;
    case "USER":
      await prisma.user.update({
        where: { id: report.targetId },
        data: { status: "BANNED" },
      });
      break;
    default:
      break;
  }
};

export const reviewReport = async ({ reportId, decision, actionUserId }) => {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return null;

  if (decision === "DELETE") {
    await deleteTarget(report);
  }

  const statusMap = {
    APPROVE: "APPROVED",
    REJECT: "REJECTED",
    DELETE: "DELETED",
  };

  const status = statusMap[decision] || "REVIEWING";

  return prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      resolvedAt: new Date(),
      resolvedById: actionUserId,
    },
  });
};

export const suspendUser = async ({ userId, reason, days, actionUserId }) => {
  const banExpiresAt = days > 0 ? new Date(Date.now() + days * 86400000) : null;
  return prisma.user.update({
    where: { id: userId },
    data: {
      status: "BANNED",
      bannedAt: new Date(),
      banReason: reason,
      banExpiresAt,
      bannedById: actionUserId,
    },
  });
};

export const getUserHistory = async (userId) => {
  const [reports, logs] = await Promise.all([
    prisma.report.count({ where: { targetId: userId, type: "USER" } }),
    prisma.log.count({ where: { userId } }),
  ]);
  return { reports, logs };
};
