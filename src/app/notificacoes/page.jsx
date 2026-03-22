import { getServerSession } from "next-auth";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import NotificationsClient from "@/components/NotificationsClient";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export default async function NotificacoesPage() {
  const session = await getServerSession(authOptions);
  let items = [];

  if (session?.user) {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (notifications.length > 0) {
      const actorIds = Array.from(
        new Set(notifications.map((item) => item.actorId))
      );
      const actors = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          email: true,
        },
      });

      const actorMap = actors.reduce((acc, actor) => {
        acc[actor.id] = actor;
        return acc;
      }, {});

      items = notifications.map((item) => ({
        ...item,
        actor: actorMap[item.actorId] || null,
      }));
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 justify-center">
          <NotificationsClient initialItems={items} />
        </main>
      </div>
    </div>
  );
}
