"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav({ role }) {
  const pathname = usePathname();
  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Utilizadores", href: "/admin/users" },
    { label: "Posts", href: "/admin/posts" },
    { label: "Denúncias", href: "/admin/reports" },
    { label: "Grupos", href: "/admin/groups" },
    ...(role === "developer"
      ? [{ label: "Moderadores", href: "/admin/moderators" }]
      : []),
    { label: "Análises", href: "/admin/analytics" },
    ...(role === "developer"
      ? [{ label: "Configurações", href: "/admin/settings" }]
      : []),
  ];

  return (
    <nav className="mt-6 flex flex-col gap-2 text-sm">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-3 py-2 font-medium transition ${
              active
                ? "bg-[var(--fh-green)]/15 text-[var(--fh-green)]"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      {role === "developer" ? (
        <Link
          href="/dev"
          className="mt-3 rounded-xl border border-dashed border-[var(--fh-green)]/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--fh-green)]"
        >
          Painel Developer
        </Link>
      ) : null}
    </nav>
  );
}
