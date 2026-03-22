import { prisma } from "@/lib/prisma";
import {
  listReports,
  listModerationUsers,
  reviewReport,
  suspendUser,
  getUserHistory,
} from "@/services/moderationService";

export const fetchReports = async (filters) => listReports(filters || {});

export const fetchModerationUsers = async (params) =>
  listModerationUsers(params || {});

export const reviewReportById = async ({ reportId, decision, userId }) => {
  const report = await reviewReport({
    reportId,
    decision,
    actionUserId: userId,
  });

  if (report) {
    await prisma.log.create({
      data: {
        userId,
        action: "MOD_REVIEW_REPORT",
        metadata: JSON.stringify({ reportId, decision }),
      },
    });
  }

  return report;
};

export const suspendUserById = async ({ userId, reason, days, actionUserId }) => {
  const result = await suspendUser({
    userId,
    reason,
    days,
    actionUserId,
  });

  await prisma.log.create({
    data: {
      userId: actionUserId,
      action: "MOD_SUSPEND_USER",
      metadata: JSON.stringify({ targetId: userId, reason, days }),
    },
  });

  return result;
};

export const getModerationLogs = async () =>
  prisma.log.findMany({
    where: { action: { startsWith: "MOD_" } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

export const getUserHistoryBasic = async (userId) => getUserHistory(userId);
