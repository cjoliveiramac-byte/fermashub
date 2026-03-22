"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const tiles = [
  {
    label: "Gerir posts",
    href: "/painel-moderacao/posts",
    description: "Rever publicações e aprovar conteúdos.",
  },
  {
    label: "Denúncias",
    href: "/painel-moderacao/denuncias",
    description: "Acompanhar denúncias da comunidade.",
  },
  {
    label: "Utilizadores",
    href: "/painel-moderacao/utilizadores",
    description: "Gerir acessos e perfis.",
  },
];

export default function AdminPanelClient() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSummary(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {summary ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="text-xs uppercase text-zinc-400">Total posts</div>
            <div className="mt-2 text-2xl font-semibold">{summary.posts}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="text-xs uppercase text-zinc-400">Utilizadores</div>
            <div className="mt-2 text-2xl font-semibold">{summary.users}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="text-xs uppercase text-zinc-400">Denúncias</div>
            <div className="mt-2 text-2xl font-semibold">
              {summary.reportsOpen}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {tiles.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm transition hover:border-[var(--fh-green)] dark:border-zinc-800/70 dark:bg-zinc-950"
          >
            <div className="text-xs uppercase text-zinc-400">{item.label}</div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {item.description}
            </div>
          </Link>
        ))}
      </section>

      <Link
        href="/painel-moderacao/denuncias"
        className="block rounded-2xl border border-dashed border-zinc-200 bg-white p-5 text-sm text-zinc-500 transition hover:border-[var(--fh-green)] dark:border-zinc-800 dark:bg-zinc-950"
      >
        Acompanhe denúncias e moderação nesta área.
      </Link>
    </div>
  );
}
