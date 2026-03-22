import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function GET() {
  const groups = await prisma.group.findMany({
    where: { isPublic: true },
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

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = normalize(body?.name);
  const description = normalize(body?.description);
  const bannerUrl = normalize(body?.bannerUrl);
  const isPublic = body?.isPublic !== false;

  if (!name) {
    return NextResponse.json({ error: "Nome obrigatorio." }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name,
      description: description || null,
      bannerUrl: bannerUrl || null,
      isPublic,
      ownerId: session.user.id,
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: session.user.id,
      role: "OWNER",
    },
  });

  await prisma.channel.createMany({
    data: [
      {
        groupId: group.id,
        name: "geral",
        type: "TEXT",
        createdById: session.user.id,
      },
      {
        groupId: group.id,
        name: "anuncios",
        type: "ANNOUNCEMENT",
        createdById: session.user.id,
      },
    ],
  });

  return NextResponse.json(group, { status: 201 });
}
