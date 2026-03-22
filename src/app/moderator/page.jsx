import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default async function ModeratorDashboard() {
  const [openReports, totalReports, bannedUsers, recentReports] =
    await Promise.all([
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.report.count(),
      prisma.user.count({ where: { status: "BANNED" } }),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <>
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Dashboard de moderação</h2>
            <p className="text-sm text-zinc-500">
              Monitorize denúncias e atividade da comunidade.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/moderator/reports"
              className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              Ver denúncias
            </Link>
            <Link
              href="/moderator/users"
              className="rounded-full bg-[var(--fh-green)] px-4 py-1.5 text-xs font-semibold text-white"
            >
              Gerir utilizadores
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-xs uppercase text-zinc-400">Denúncias abertas</div>
          <div className="mt-2 text-2xl font-semibold">{openReports}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-xs uppercase text-zinc-400">Total denúncias</div>
          <div className="mt-2 text-2xl font-semibold">{totalReports}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-xs uppercase text-zinc-400">Utilizadores suspensos</div>
          <div className="mt-2 text-2xl font-semibold">{bannedUsers}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Denúncias recentes</h3>
          <Link
            href="/moderator/reports"
            className="text-xs font-semibold text-[var(--fh-green)]"
          >
            Abrir painel completo
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {recentReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800">
              Nenhuma denúncia registada.
            </div>
          ) : (
            recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200/70 p-4 text-sm dark:border-zinc-800"
              >
                <div>
                  <div className="font-semibold">{report.type}</div>
                  <div className="text-xs text-zinc-500">
                    {formatDate(report.createdAt)} - prioridade {report.priority}
                  </div>
                </div>
                <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 dark:border-zinc-700">
                  {report.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

