import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);
  const group = await prisma.group.findUnique({ where: { id: params.id } });

  if (!group) {
    return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
  }

  let membership = null;
  if (session?.user) {
    membership = await prisma.groupMember.findFirst({
      where: { groupId: group.id, userId: session.user.id },
    });
  }

  const channels = await prisma.channel.findMany({
    where: { groupId: group.id },
    orderBy: { createdAt: "asc" },
  });

  const members = membership
    ? await prisma.groupMember.findMany({
        where: { groupId: group.id, status: { not: "BANNED" } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const memberIds = members.map((member) => member.userId);
  const users = memberIds.length
    ? await prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, name: true, username: true, image: true },
      })
    : [];

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  const membersWithProfile = members.map((member) => ({
    ...member,
    profile: userMap[member.userId] || null,
  }));

  return NextResponse.json({
    group,
    channels,
    members: membersWithProfile,
    membership,
  });
}

