import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const getTargetUser = async (body) => {
  const targetId = normalize(body?.targetUserId);
  const targetEmail = normalize(body?.targetEmail)?.toLowerCase();
  const targetUsername = normalize(body?.targetUsername);

  if (targetId) {
    return prisma.user.findUnique({ where: { id: targetId } });
  }
  if (targetEmail) {
    return prisma.user.findUnique({ where: { email: targetEmail } });
  }
  if (targetUsername) {
    return prisma.user.findUnique({ where: { username: targetUsername } });
  }
  return null;
};

const resolveMemberIds = async (body) => {
  const memberIds = Array.isArray(body?.memberIds) ? body.memberIds : [];
  const memberUsernames = Array.isArray(body?.memberUsernames)
    ? body.memberUsernames
    : [];
  const memberEmails = Array.isArray(body?.memberEmails)
    ? body.memberEmails
    : [];

  const [usersByUsername, usersByEmail] = await Promise.all([
    memberUsernames.length
      ? prisma.user.findMany({ where: { username: { in: memberUsernames } } })
      : [],
    memberEmails.length
      ? prisma.user.findMany({
          where: { email: { in: memberEmails.map((item) => item.toLowerCase()) } },
        })
      : [],
  ]);

  const resolvedIds = [
    ...memberIds,
    ...usersByUsername.map((user) => user.id),
    ...usersByEmail.map((user) => user.id),
  ];

  return Array.from(new Set(resolvedIds));
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isDeveloper = session.user.role === "developer";
  const memberships = isDeveloper
    ? await prisma.conversationMember.findMany()
    : await prisma.conversationMember.findMany({
        where: { userId: session.user.id },
      });

  const conversationIds = Array.from(
    new Set(memberships.map((member) => member.conversationId))
  );

  if (conversationIds.length === 0) {
    return NextResponse.json([]);
  }

  const [conversations, members, messages] = await Promise.all([
    prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.conversationMember.findMany({
      where: { conversationId: { in: conversationIds } },
    }),
    prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const userIds = Array.from(new Set(members.map((m) => m.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, username: true, image: true, email: true },
  });

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  const membersByConversation = members.reduce((acc, member) => {
    acc[member.conversationId] = acc[member.conversationId] || [];
    acc[member.conversationId].push(member);
    return acc;
  }, {});

  const lastMessageMap = {};
  messages.forEach((message) => {
    if (!lastMessageMap[message.conversationId]) {
      lastMessageMap[message.conversationId] = message;
    }
  });

  const messagesByConversation = messages.reduce((acc, message) => {
    acc[message.conversationId] = acc[message.conversationId] || [];
    acc[message.conversationId].push(message);
    return acc;
  }, {});

  const memberMap = memberships.reduce((acc, member) => {
    acc[member.conversationId] = member;
    return acc;
  }, {});

  const response = conversations.map((conversation) => {
    const conversationMembers = membersByConversation[conversation.id] || [];
    const participants = conversationMembers
      .map((member) => ({
        ...(userMap[member.userId] || {}),
        memberRole: member.role,
      }))
      .filter((user) => user.id);

    const other = participants.find(
      (participant) => participant.id !== session.user.id
    );
    const title =
      conversation.title ||
      (conversation.type === "DIRECT" && other
        ? other.name || other.username || other.email
        : "Grupo");

    const lastReadAt = memberMap[conversation.id]?.lastReadAt || new Date(0);
    const currentMemberRole = memberMap[conversation.id]?.role || "MEMBER";
    const conversationMessages = messagesByConversation[conversation.id] || [];
    const unreadCount = conversationMessages.filter(
      (msg) =>
        new Date(msg.createdAt) > lastReadAt &&
        msg.senderId !== session.user.id
    ).length;

      return {
        ...conversation,
        title,
        participants,
        lastMessage: lastMessageMap[conversation.id] || null,
        unreadCount,
        currentMemberRole,
      };
  });

  return NextResponse.json(response);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const type = normalize(body?.type || "DIRECT").toUpperCase();

  if (type === "DIRECT") {
    const target = await getTargetUser(body);
    if (!target) {
      return NextResponse.json(
        { error: "Utilizador não encontrado." },
        { status: 404 }
      );
    }

    if (target.id === session.user.id) {
      return NextResponse.json(
        { error: "Não podes iniciar conversa contigo mesmo." },
        { status: 400 }
      );
    }

    const userMemberships = await prisma.conversationMember.findMany({
      where: { userId: session.user.id },
    });
    const convoIds = userMemberships.map((m) => m.conversationId);
    const existing = convoIds.length
      ? await prisma.conversationMember.findFirst({
          where: {
            userId: target.id,
            conversationId: { in: convoIds },
          },
        })
      : null;

    if (existing) {
      return NextResponse.json({ conversationId: existing.conversationId });
    }

    const conversation = await prisma.conversation.create({
      data: { type: "DIRECT" },
    });

    await prisma.conversationMember.createMany({
      data: [
        {
          conversationId: conversation.id,
          userId: session.user.id,
          role: "ADMIN",
        },
        {
          conversationId: conversation.id,
          userId: target.id,
          role: "MEMBER",
        },
      ],
    });

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
  }

  const title = normalize(body?.title) || "Novo grupo";
  const resolvedMemberIds = await resolveMemberIds(body);
  const uniqueMembers = Array.from(
    new Set([session.user.id, ...resolvedMemberIds])
  );

  const conversation = await prisma.conversation.create({
    data: { type: "GROUP", title },
  });

  await prisma.conversationMember.createMany({
    data: uniqueMembers.map((id) => ({
      conversationId: conversation.id,
      userId: id,
      role: id === session.user.id ? "ADMIN" : "MEMBER",
    })),
  });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}

