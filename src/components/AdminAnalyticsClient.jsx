"use client";

import { useEffect, useMemo, useState } from "react";

const LineChart = ({ data }) => {
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
      <div className="flex h-40 items-center justify-center text-xs text-zinc-400">
        Sem dados
      </div>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="h-40 w-full">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        points={points}
        className="text-[var(--fh-green)]"
      />
      <polyline
        fill="url(#chart-fill)"
        stroke="none"
        points={`0,100 ${points} 100,100`}
      />
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(15,107,95,0.3)" />
          <stop offset="100%" stopColor="rgba(15,107,95,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const BarList = ({ data }) => (
  <div className="mt-4 grid grid-cols-7 gap-2 text-[10px] text-zinc-500">
    {data?.slice(-7).map((item) => (
      <div key={item.date} className="text-center">
        <div className="mb-2 h-12 rounded-lg bg-[var(--fh-green)]/20">
          <div
            className="h-full rounded-lg bg-[var(--fh-green)]/60"
            style={{ height: `${Math.min(100, item.count * 8)}%` }}
            title={`${item.date}: ${item.count}`}
          />
        </div>
        {item.date.slice(5)}
      </div>
    ))}
  </div>
);

export default function AdminAnalyticsClient() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMetrics(data))
      .catch(() => {});
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Crescimento de utilizadores</h3>
          <span className="text-xs text-zinc-400">14 dias</span>
        </div>
        <LineChart data={metrics?.growth} />
        <BarList data={metrics?.growth || []} />
      </div>
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Atividade de posts</h3>
          <span className="text-xs text-zinc-400">14 dias</span>
        </div>
        <LineChart data={metrics?.postsActivity} />
        <BarList data={metrics?.postsActivity || []} />
      </div>
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950 md:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Engajamento geral</h3>
          <span className="text-xs text-zinc-400">Mensagens/dia</span>
        </div>
        <LineChart data={metrics?.engagement} />
        <BarList data={metrics?.engagement || []} />
      </div>
    </div>
  );
}
