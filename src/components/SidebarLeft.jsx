"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SidebarLeft() {
  const { data } = useSession();
  const role = data?.user?.role || "user";
  const username = data?.user?.username;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/", label: "Home" },
    { href: "/posts", label: "Posts" },
    { href: "/eventos", label: "Eventos" },
    { href: "/videos", label: "Vídeos" },
    { href: "/grupos", label: "Grupos" },
    { href: "/mensagens", label: "Mensagens" },
    { href: "/notificacoes", label: "Notificações" },
    { href: username ? `/perfil/${username}` : "/login", label: "Perfil" },
  ];

  const items = [
    ...navItems,
    ...(role === "developer" || role === "moderator"
      ? [
          { href: "/admin", label: "Painel Admin" },
          { href: "/moderator", label: "Painel Moderação" },
          { href: "/moderator/reports", label: "Denúncias" },
          { href: "/moderator/users", label: "Gerir utilizadores" },
        ]
      : []),
    ...(role === "developer"
      ? [
          { href: "/dev", label: "Painel Dev" },
          { href: "/dev/logs", label: "Logs do sistema" },
          { href: "/dev/users", label: "Contas" },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:flex w-56 flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-[var(--fh-green)]/5 via-white to-[var(--fh-yellow)]/5 p-4 shadow-sm dark:border-zinc-800/70 dark:from-[var(--fh-green)]/10 dark:via-zinc-950 dark:to-[var(--fh-yellow)]/10">
        <div className="text-xs font-semibold uppercase text-zinc-400">
          Atalhos
        </div>
        <nav className="mt-3 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
