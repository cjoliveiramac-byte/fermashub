import { getServerSession } from "next-auth";
import AdminSettingsClient from "@/components/AdminSettingsClient";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "user";
  let settings = await prisma.platformSetting.findFirst();
  if (!settings) {
    settings = await prisma.platformSetting.create({ data: {} });
  }
  const flags =
    role === "developer"
      ? await prisma.featureFlag.findMany({ orderBy: { name: "asc" } })
      : [];
  const logs =
    role === "developer"
      ? await prisma.log.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [];

  return (
    <AdminSettingsClient
      initialSettings={settings}
      initialFlags={flags}
      initialLogs={logs}
      initialRole={role}
    />
  );
}
