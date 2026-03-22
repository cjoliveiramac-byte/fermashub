import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const groupIds = groups.map((group) => group.id);
  const members = groupIds.length
    ? await prisma.groupMember.findMany({
        where: { groupId: { in: groupIds }, status: { not: "BANNED" } },
      })
    : [];

  const membersCount = members.reduce((acc, member) => {
    acc[member.groupId] = (acc[member.groupId] || 0) + 1;
    return acc;
  }, {});

  const response = groups.map((group) => ({
    ...group,
    membersCount: membersCount[group.id] || 0,
  }));

  return NextResponse.json(response);
}
