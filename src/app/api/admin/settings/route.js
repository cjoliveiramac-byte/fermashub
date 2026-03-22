import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

const getSettings = async () => {
  const existing = await prisma.platformSetting.findFirst();
  if (existing) return existing;
  return prisma.platformSetting.create({ data: {} });
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const platformName = normalize(body?.platformName);
  const maintenanceMode = Boolean(body?.maintenanceMode);

  const current = await getSettings();
  const updated = await prisma.platformSetting.update({
    where: { id: current.id },
    data: {
      platformName: platformName || current.platformName,
      maintenanceMode,
    },
  });

  await prisma.log.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_SETTINGS_UPDATE",
      metadata: JSON.stringify({
        platformName: updated.platformName,
        maintenanceMode: updated.maintenanceMode,
      }),
    },
  });

  return NextResponse.json(updated);
}
