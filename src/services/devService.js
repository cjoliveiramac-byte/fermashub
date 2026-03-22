import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();
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

export const getSystemStatus = async () => {
  let dbStatus = "unknown";
  try {
    const result = await prisma.$runCommandRaw({ ping: 1 });
    dbStatus = result?.ok === 1 ? "ok" : "error";
  } catch {
    dbStatus = "error";
  }

  return {
    uptime: process.uptime(),
    node: process.version,
    db: dbStatus,
  };
};

export const listLogs = async ({ action, userId }) => {
  const where = {};
  if (action) where.action = action;
  if (userId) where.userId = userId;
  return prisma.log.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
};

export const listCollections = async () => {
  const result = await prisma.$runCommandRaw({ listCollections: 1 });
  return result?.cursor?.firstBatch || [];
};

const collectionsMap = {
  users: prisma.user,
  posts: prisma.post,
  comments: prisma.comment,
  reports: prisma.report,
  logs: prisma.log,
  apikeys: prisma.apiKey,
  featureflags: prisma.featureFlag,
  messages: prisma.message,
  conversations: prisma.conversation,
};

const userSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  role: true,
  status: true,
  bannedAt: true,
  banReason: true,
  banExpiresAt: true,
  createdAt: true,
  updatedAt: true,
};

export const queryCollection = async ({ collection, where, take }) => {
  const client = collectionsMap[collection];
  if (!client) return [];
  return client.findMany({
    where: where || {},
    take: Math.min(50, Math.max(1, take || 20)),
  });
};

export const listApiKeys = async () =>
  prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });

export const createApiKey = async ({ name, createdBy }) => {
  const rawKey = crypto.randomBytes(24).toString("hex");
  const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const prefix = rawKey.slice(0, 6);

  const record = await prisma.apiKey.create({
    data: {
      key: hash,
      prefix,
      name: name || "Nova chave",
      createdBy,
    },
  });

  return { record, rawKey };
};

export const revokeApiKey = async (id) =>
  prisma.apiKey.update({
    where: { id },
    data: { revoked: true, revokedAt: new Date() },
  });

export const listFeatureFlags = async () =>
  prisma.featureFlag.findMany({ orderBy: { name: "asc" } });

export const upsertFeatureFlag = async ({ name, enabled }) =>
  prisma.featureFlag.upsert({
    where: { name },
    update: { enabled },
    create: { name, enabled },
  });

export const updateFeatureFlag = async (id, enabled) =>
  prisma.featureFlag.update({
    where: { id },
    data: { enabled },
  });

export const getSafeEnv = () => {
  const allowList = [
    "NODE_ENV",
    "NEXTAUTH_URL",
    "DATABASE_URL",
    "GOOGLE_CLIENT_ID",
  ];
  return allowList.map((key) => {
    const value = process.env[key];
    if (!value) {
      return { key, value: "" };
    }
    const masked =
      value.length <= 6
        ? "***"
        : `${value.slice(0, 3)}***${value.slice(-3)}`;
    return { key, value: masked };
  });
};

export const listUsers = async ({ take, search }) => {
  const where = search
    ? {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
          { username: { contains: search } },
        ],
      }
    : {};
  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, take || 50)),
    select: userSelect,
  });
};

export const createUser = async ({ email, name, password, role }) => {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    const error = new Error("Email ja registado.");
    error.code = "DUPLICATE_EMAIL";
    throw error;
  }

  const baseUsername = buildUsername(normalizedEmail);
  const username = await ensureUniqueUsername(baseUsername);
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || username,
      username,
      passwordHash,
      role,
      image: `https://i.pravatar.cc/150?u=${encodeURIComponent(
        normalizedEmail
      )}`,
    },
    select: userSelect,
  });
};

export const updateUser = async ({ userId, data }) =>
  prisma.user.update({ where: { id: userId }, data, select: userSelect });

export const deleteUser = async (userId) =>
  prisma.user.delete({ where: { id: userId }, select: userSelect });
