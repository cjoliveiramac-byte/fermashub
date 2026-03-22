import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default async function EventosPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "user";
  const canPost = role === "developer" || role === "moderator";
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Eventos</h1>
            {canPost ? (
              <Link
                href="/eventos/novo"
                className="rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
              >
                Novo evento
              </Link>
            ) : (
              <span className="text-xs text-zinc-400">
                Criacao apenas para moderadores.
              </span>
            )}
          </div>

          {events.length === 0 ? (
            <div className="block rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              Nenhum evento criado ainda.{" "}
              {canPost ? (
                <Link
                  href="/eventos/novo"
                  className="font-semibold text-[var(--fh-green)]"
                >
                  Criar evento
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/eventos/${event.id}`}
                  className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm transition hover:border-[var(--fh-green)] dark:border-zinc-800/70 dark:bg-zinc-950"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-900">
                      <Image
                        src="/got-monday.png"
                        alt="Evento"
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{event.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {event.location} - {formatDate(event.date)}
                      </div>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {event.description.slice(0, 180)}...
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
