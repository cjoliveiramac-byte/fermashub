import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const sanitizeRole = (value) => {
  const input = normalize(value).toUpperCase();
  if (["OWNER", "ADMIN", "MODERATOR", "MEMBER"].includes(input)) {
    return input;
  }
  return null;
};

const sanitizeStatus = (value) => {
  const input = normalize(value).toUpperCase();
  if (["ACTIVE", "MUTED", "BANNED"].includes(input)) {
    return input;
  }
  return null;
};

const requireAdmin = async (groupId, userId) => {
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
  if (!membership || membership.status === "BANNED") return null;
  if (!["OWNER", "ADMIN"].includes(membership.role)) return null;
  return membership;
};

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await requireAdmin(params.id, session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const role = sanitizeRole(body?.role);
  const status = sanitizeStatus(body?.status);
  const mutedUntil = body?.mutedUntil ? new Date(body.mutedUntil) : null;

  const data = {};
  if (role) data.role = role;
  if (status) data.status = status;
  if (status === "MUTED") data.mutedUntil = mutedUntil || new Date(Date.now() + 3600000);
  if (status && status !== "MUTED") data.mutedUntil = null;

  const member = await prisma.groupMember.update({
    where: { id: params.memberId },
    data,
  });

  return NextResponse.json(member);
}

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await requireAdmin(params.id, session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.groupMember.delete({ where: { id: params.memberId } });
  return NextResponse.json({ ok: true });
}
