const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf8");
  const line = env
    .split(/\r?\n/)
    .find((item) => item.startsWith("DATABASE_URL="));
  if (line) {
    process.env.DATABASE_URL = line
      .slice("DATABASE_URL=".length)
      .replace(/^"|"$/g, "");
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/delete-user.js email");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.deleteMany({ where: { email } });
  console.log(`deleted ${result.count} user(s) for ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
