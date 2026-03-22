"use client";

import { useEffect, useMemo, useState } from "react";

const Sparkline = ({ data }) => {
  const points = useMemo(() => {
    if (!data?.length) return "";
    const values = data.map((item) => item.count);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    return data
      .map((item, index) => {
        const x = (index / (data.length - 1 || 1)) * 100;
        const y = 100 - ((item.count - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  if (!points) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-zinc-400">
        Sem dados
      </div>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="h-32 w-full">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        points={points}
        className="text-[var(--fh-green)]"
      />
      <polyline
        fill="url(#spark-fill)"
        stroke="none"
        points={`0,100 ${points} 100,100`}
      />
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(15,107,95,0.35)" />
          <stop offset="100%" stopColor="rgba(15,107,95,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default function AdminDashboardClient() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMetrics(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Total de utilizadores",
            value: metrics?.totalUsers ?? "-",
          },
          {
            label: "Ativos hoje",
            value: metrics?.activeToday ?? "-",
          },
          {
            label: "Posts hoje",
            value: metrics?.postsToday ?? "-",
          },
          {
            label: "Denúncias abertas",
            value: metrics?.reportsOpen ?? "-",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950"
          >
            <div className="text-xs uppercase text-zinc-400">{card.label}</div>
            <div className="mt-3 text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Crescimento da plataforma</h3>
            <span className="text-xs text-zinc-400">14 dias</span>
          </div>
          <Sparkline data={metrics?.growth} />
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Atividade de posts</h3>
            <span className="text-xs text-zinc-400">14 dias</span>
          </div>
          <Sparkline data={metrics?.postsActivity} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Engajamento (mensagens)</h3>
          <span className="text-xs text-zinc-400">14 dias</span>
        </div>
        <Sparkline data={metrics?.engagement} />
      </section>
    </div>
  );
}

