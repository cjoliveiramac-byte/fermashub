import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const getTargetUser = async (params) => {
  const username = normalize(params?.username);
  const userId = normalize(params?.userId);

  if (userId) {
    return prisma.user.findUnique({ where: { id: userId } });
  }
  if (username) {
    return prisma.user.findUnique({ where: { username } });
  }
  return null;
};

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const target = await getTargetUser({
    userId: searchParams.get("userId"),
    username: searchParams.get("username"),
  });

  if (!target) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: target.id } }),
    prisma.follow.count({ where: { followerId: target.id } }),
  ]);

  const isFollowing = session?.user
    ? !!(await prisma.follow.findFirst({
        where: { followerId: session.user.id, followingId: target.id },
      }))
    : false;

  return NextResponse.json({
    userId: target.id,
    followers,
    following,
    isFollowing,
  });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const target = await getTargetUser(body);
  if (!target) {
    return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
  }

  if (target.id === session.user.id) {
    return NextResponse.json(
      { error: "Não podes seguir a ti próprio." },
      { status: 400 }
    );
  }

  const existing = await prisma.follow.findFirst({
    where: { followerId: session.user.id, followingId: target.id },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: session.user.id, followingId: target.id },
    });

    await prisma.notification.create({
      data: {
        recipientId: target.id,
        actorId: session.user.id,
        type: "FOLLOW",
        message: "comecou a seguir-te.",
      },
    });
  }

  const followers = await prisma.follow.count({
    where: { followingId: target.id },
  });

  return NextResponse.json({ isFollowing: !existing, followers });
}

