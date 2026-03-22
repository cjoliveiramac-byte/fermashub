import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dev" },
  { label: "Logs", href: "/dev/logs" },
  { label: "Base de dados", href: "/dev/db" },
  { label: "API Keys", href: "/dev/api-keys" },
  { label: "Feature Flags", href: "/dev/flags" },
  { label: "Utilizadores", href: "/dev/users" },
  { label: "Variaveis", href: "/dev/env" },
  { label: "Status", href: "/dev/status" },
];

export default function DevLayout({ children }) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <aside className="hidden lg:flex w-64 flex-col gap-6 rounded-3xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div>
            <div className="text-xs uppercase text-zinc-400">Painel</div>
            <h1 className="mt-2 text-xl font-semibold">Developer</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Controlo total do sistema.
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-left font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex flex-1 flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
