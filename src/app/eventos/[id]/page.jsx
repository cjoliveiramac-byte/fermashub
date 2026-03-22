import Link from "next/link";
import { notFound } from "next/navigation";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default async function EventoPage({ params }) {
  const resolvedParams =
    typeof params?.then === "function" ? await params : params;
  const eventId = resolvedParams?.id;
  if (!eventId) {
    notFound();
  }
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 justify-center">
          <article className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500">
              {event.location} - {formatDate(event.date)}
            </div>
            <h1 className="mt-2 text-2xl font-semibold">{event.title}</h1>
            <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
              {event.description}
            </p>
            <div className="mt-6 flex items-center justify-between">
              <Link
                href="/eventos"
                className="text-xs font-semibold text-[var(--fh-green)]"
              >
                Voltar aos eventos
              </Link>
              <span className="text-xs text-zinc-500">
                Criado por {event.createdBy}
              </span>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
