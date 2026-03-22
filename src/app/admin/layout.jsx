import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "user";

  if (!session?.user || !["developer", "moderator"].includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-6">
        <div className="rounded-3xl border border-zinc-200/70 bg-white p-8 text-center shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Apenas administradores e moderadores podem aceder a este painel.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  const displayName = session.user.name || session.user.username || "Admin";

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
        <aside className="hidden lg:flex w-72 flex-col gap-6 rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
          <div>
            <div className="text-xs uppercase text-zinc-400">FermasHub</div>
            <h1 className="mt-2 text-xl font-semibold">
              Painel de Administração
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Controlo total, moderação e métricas em tempo real.
            </p>
          </div>
          <AdminNav role={role} />
          <div className="mt-auto rounded-2xl border border-zinc-200/70 bg-white p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            Sessão ativa como <span className="font-semibold">{displayName}</span>
            <div className="mt-2 flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                Voltar a plataforma
              </Link>
              <Link
                href="/notificacoes"
                className="rounded-full bg-[var(--fh-green)] px-3 py-1 text-[11px] font-semibold text-white"
              >
                Notificações
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col gap-6">
          <header className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase text-zinc-400">
                  Centro de comando
                </div>
                <h2 className="mt-2 text-2xl font-semibold">
                  Bem-vindo, {displayName}
                </h2>
                <p className="text-sm text-zinc-500">
                  Monitorize a plataforma e aja rapidamente sempre que preciso.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/reports"
                  className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Denúncias pendentes
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
                >
                  Gerir utilizadores
                </Link>
              </div>
            </div>
          </header>
          <div className="lg:hidden rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
            <AdminNav role={role} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
