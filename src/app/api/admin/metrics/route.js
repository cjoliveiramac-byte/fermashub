import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);

  const [
    totalUsers,
    postsToday,
    reportsOpen,
    todaysPosts,
    todaysComments,
    todaysMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.post.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { authorId: true },
    }),
    prisma.comment.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { authorId: true },
    }),
    prisma.message.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { senderId: true },
    }),
  ]);

  const activeUsers = new Set([
    ...todaysPosts.map((item) => item.authorId),
    ...todaysComments.map((item) => item.authorId),
    ...todaysMessages.map((item) => item.senderId),
  ]);

  const days = 14;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const [recentUsers, recentPosts, recentMessages] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.post.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.message.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
  ]);

  const makeDayMap = () =>
    Array.from({ length: days }).reduce((acc, _, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      acc[key] = 0;
      return acc;
    }, {});

  const growthMap = makeDayMap();
  const postsMap = makeDayMap();
  const messagesMap = makeDayMap();

  recentUsers.forEach((user) => {
    const key = new Date(user.createdAt).toISOString().slice(0, 10);
    if (growthMap[key] !== undefined) {
      growthMap[key] += 1;
    }
  });

  recentPosts.forEach((post) => {
    const key = new Date(post.createdAt).toISOString().slice(0, 10);
    if (postsMap[key] !== undefined) {
      postsMap[key] += 1;
    }
  });

  recentMessages.forEach((message) => {
    const key = new Date(message.createdAt).toISOString().slice(0, 10);
    if (messagesMap[key] !== undefined) {
      messagesMap[key] += 1;
    }
  });

  const growth = Object.entries(growthMap).map(([date, count]) => ({
    date,
    count,
  }));
  const postsActivity = Object.entries(postsMap).map(([date, count]) => ({
    date,
    count,
  }));
  const engagement = Object.entries(messagesMap).map(([date, count]) => ({
    date,
    count,
  }));

  return NextResponse.json({
    totalUsers,
    activeToday: activeUsers.size,
    postsToday,
    reportsOpen,
    growth,
    postsActivity,
    engagement,
  });
}
