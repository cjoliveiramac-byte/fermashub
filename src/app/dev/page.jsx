import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DevDashboard() {
  const [users, logs, reports, flags, keys] = await Promise.all([
    prisma.user.count(),
    prisma.log.count(),
    prisma.report.count(),
    prisma.featureFlag.count(),
    prisma.apiKey.count(),
  ]);

  return (
    <>
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Dashboard do developer</h2>
            <p className="text-sm text-zinc-500">
              Estado geral e controlo total do FermasHub.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dev/status"
              className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              Status
            </Link>
            <Link
              href="/dev/logs"
              className="rounded-full bg-[var(--fh-green)] px-4 py-1.5 text-xs font-semibold text-white"
            >
              Ver logs
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-xs uppercase text-zinc-400">Utilizadores</div>
          <div className="mt-2 text-2xl font-semibold">{users}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-xs uppercase text-zinc-400">Logs</div>
          <div className="mt-2 text-2xl font-semibold">{logs}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-xs uppercase text-zinc-400">Denúncias</div>
          <div className="mt-2 text-2xl font-semibold">{reports}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-xs uppercase text-zinc-400">Feature Flags</div>
          <div className="mt-2 text-2xl font-semibold">{flags}</div>
          <Link
            href="/dev/flags"
            className="mt-3 inline-flex text-xs font-semibold text-[var(--fh-green)]"
          >
            Gerir flags
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="text-xs uppercase text-zinc-400">API Keys</div>
          <div className="mt-2 text-2xl font-semibold">{keys}</div>
          <Link
            href="/dev/api-keys"
            className="mt-3 inline-flex text-xs font-semibold text-[var(--fh-green)]"
          >
            Gerir chaves
          </Link>
        </div>
      </section>
    </>
  );
}
