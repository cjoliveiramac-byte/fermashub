const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const loadEnv = (filename) => {
  const filepath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    if (!line || line.startsWith("#")) return;
    const idx = line.indexOf("=");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const raw = line.slice(idx + 1).trim();
    const value = raw.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnv(".env");
loadEnv(".env.local");

const prisma = new PrismaClient();

const normalizeCollection = async (name) => {
  return prisma.$runCommandRaw({
    update: name,
    updates: [
      { q: { role: "MEMBER" }, u: { $set: { role: "USER" } }, multi: true },
      { q: { role: "developer" }, u: { $set: { role: "DEVELOPER" } }, multi: true },
      { q: { role: "DEVELOPER" }, u: { $set: { role: "DEVELOPER" } }, multi: true },
      { q: { role: "moderator" }, u: { $set: { role: "MODERATOR" } }, multi: true },
      { q: { role: "MODERATOR" }, u: { $set: { role: "MODERATOR" } }, multi: true },
      { q: { role: "member" }, u: { $set: { role: "USER" } }, multi: true },
      { q: { role: "user" }, u: { $set: { role: "USER" } }, multi: true },
    ],
  });
};

async function main() {
  const resultUser = await normalizeCollection("User");
  const resultUsers = await normalizeCollection("users");
  console.log("Roles normalizados:", { User: resultUser, users: resultUsers });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
