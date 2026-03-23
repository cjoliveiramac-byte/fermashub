import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const safeEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

const getCodes = () => {
  const dev = normalize(process.env.DEV_ACCESS_CODE);
  const mods = normalize(process.env.MOD_ACCESS_CODES)
    .split(",")
    .map((item) => normalize(item))
    .filter(Boolean);
  return { dev, mods };
};

const normalizeEmail = (email) => normalize(email).toLowerCase();

const buildUsername = (email) => {
  const raw = normalizeEmail(email).split("@")[0] || "user";
  const cleaned = raw.replace(/[^a-zA-Z0-9._]/g, "");
  return cleaned || "user";
};

const ensureUniqueUsername = async (base) => {
  let candidate = base;
  let counter = 1;
  while (await prisma.user.findFirst({ where: { username: candidate } })) {
    candidate = `${base}${counter}`;
    counter += 1;
  }
  return candidate;
};

export async function POST(request) {
  try {
    const body = await request.json();
    const name = normalize(body?.name);
    const email = normalizeEmail(body?.email);
    const rawPassword = body?.password || "";
    const password = normalize(rawPassword);
    const accessCode = normalize(body?.accessCode);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha sao obrigatorios." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este email ja esta registado." },
        { status: 409 }
      );
    }

    const { dev, mods } = getCodes();
    let role = "USER";

    if (dev && safeEqual(password, dev)) {
      const devExists = await prisma.user.findFirst({
        where: { role: "DEVELOPER" },
      });
      if (devExists) {
        await prisma.user.update({
          where: { id: devExists.id },
          data: { role: "USER" },
        });
      }
      role = "DEVELOPER";
    } else if (mods.some((mod) => safeEqual(password, mod))) {
      role = "MODERATOR";
    } else if (accessCode) {
      return NextResponse.json(
        { error: "Codigo especial invalido." },
        { status: 400 }
      );
    }

    const baseUsername = buildUsername(email);
    const username = await ensureUniqueUsername(baseUsername);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || username,
        username,
        passwordHash,
        role,
        image: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role.toLowerCase(),
    });
  } catch (error) {
    console.error("register error", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email ou username ja existe." },
        { status: 409 }
      );
    }
    const message =
      process.env.NODE_ENV === "development"
        ? error?.message || "Falha ao criar conta."
        : "Falha ao criar conta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
