import Link from "next/link";
import { getServerSession } from "next-auth";
import Topbar from "@/components/Topbar";
import SidebarLeft from "@/components/SidebarLeft";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-6">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 text-center shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold">Sessao expirada</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Faz login novamente para aceder ao painel.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-[var(--fh-green)] px-4 py-1.5 text-xs font-semibold text-white"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  const [postsCount, commentsCount, followersCount] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id } }),
    prisma.comment.count({ where: { authorId: user.id } }),
    prisma.follow.count({ where: { followingId: user.id } }),
  ]);

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />

        <main className="flex flex-1 flex-col gap-6">
          <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-lg font-semibold">Painel do utilizador</h1>
                <p className="text-sm text-zinc-500">
                  Acompanhe a sua atividade e perfil.
                </p>
              </div>
              <Link
                href={`/perfil/${user.username}`}
                className="inline-flex rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                Ver perfil
              </Link>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              <div className="text-xs uppercase text-zinc-400">Posts</div>
              <div className="mt-2 text-2xl font-semibold">{postsCount}</div>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              <div className="text-xs uppercase text-zinc-400">Comentários</div>
              <div className="mt-2 text-2xl font-semibold">{commentsCount}</div>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              <div className="text-xs uppercase text-zinc-400">Seguidores</div>
              <div className="mt-2 text-2xl font-semibold">
                {followersCount}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Link
              href="/mensagens"
              className="rounded-2xl border border-zinc-200/70 bg-white p-4 text-sm text-zinc-600 shadow-sm transition hover:border-[var(--fh-green)] dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-300"
            >
              Ir para mensagens privadas e grupos.
            </Link>
            <Link
              href="/notificacoes"
              className="rounded-2xl border border-zinc-200/70 bg-white p-4 text-sm text-zinc-600 shadow-sm transition hover:border-[var(--fh-green)] dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-300"
            >
              Rever notificacoes e atividade recente.
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
