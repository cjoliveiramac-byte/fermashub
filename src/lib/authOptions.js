import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();
const normalizeEmail = (email) => normalize(email).toLowerCase();

const buildUsername = (email) => {
  const raw = normalizeEmail(email).split("@")[0] || "user";
  const cleaned = raw.replace(/[^a-zA-Z0-9._]/g, "");
  return cleaned || "user";
};

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

const ensureUniqueUsername = async (base) => {
  let candidate = base;
  let counter = 1;
  while (await prisma.user.findFirst({ where: { username: candidate } })) {
    candidate = `${base}${counter}`;
    counter += 1;
  }
  return candidate;
};

const providers = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = (credentials?.email || "").trim().toLowerCase();
      const rawPassword = credentials?.password || "";
      const password = normalize(rawPassword);

      if (!email || !password) {
        return null;
      }

      const { dev, mods } = getCodes();
      const isDevCode = dev && safeEqual(password, dev);
      const isModCode = mods.some((mod) => safeEqual(password, mod));

      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        if (!isDevCode && !isModCode) {
          return null;
        }
        const baseUsername = buildUsername(email);
        const username = await ensureUniqueUsername(baseUsername);
        user = await prisma.user.create({
          data: {
            email,
            name: username,
            username,
            role: isDevCode ? "DEVELOPER" : "MODERATOR",
            image: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
          },
        });
      }

      if (user.status === "BANNED") {
        return null;
      }

      const hasPassword = Boolean(user.passwordHash);
      const validPassword = hasPassword
        ? await bcrypt.compare(rawPassword, user.passwordHash)
        : false;

      if (!validPassword && !isDevCode && !isModCode) {
        return null;
      }

      let sessionRole = user.role;
      if (isDevCode) {
        sessionRole = "DEVELOPER";
      } else if (isModCode) {
        sessionRole = "MODERATOR";
      }

      const fallbackUsername = user.username || user.email?.split("@")[0];
      const normalizedRole =
        sessionRole === "MEMBER" || sessionRole === "member"
          ? "user"
          : sessionRole.toLowerCase();

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        username: fallbackUsername,
        role: normalizedRole,
        image: user.image,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = normalizeEmail(user?.email);
      if (!email) {
        return false;
      }

      let dbUser = await prisma.user.findUnique({ where: { email } });
      if (!dbUser) {
        const baseUsername = buildUsername(email);
        const username = await ensureUniqueUsername(baseUsername);
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name || username,
            username,
            role: "USER",
            image:
              user.image ||
              `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
          },
        });
      }

      if (dbUser.role === "MEMBER") {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: "USER" },
        });
      }

      if (dbUser.status === "BANNED") {
        return false;
      }

      user.id = dbUser.id;
      user.role =
        dbUser.role === "MEMBER" || dbUser.role === "member"
          ? "user"
          : dbUser.role.toLowerCase();
      user.username = dbUser.username;
      user.name = dbUser.name;
      user.image = dbUser.image;

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
  },
};
