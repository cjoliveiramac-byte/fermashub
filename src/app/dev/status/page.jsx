"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DevStatusPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/status");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error("Falha ao carregar status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Status do sistema</h2>
        <p className="text-sm text-zinc-500">
          Monitorizacao da aplicacao e base de dados.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 text-sm shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-zinc-500">Carregando...</div>
        ) : status ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-200/70 p-4 dark:border-zinc-800">
              <div className="font-semibold">Uptime</div>
              <div className="text-xs text-zinc-500">
                {Math.round(status.uptime)}s
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/70 p-4 dark:border-zinc-800">
              <div className="font-semibold">Node</div>
              <div className="text-xs text-zinc-500">{status.node}</div>
            </div>
            <div className="rounded-xl border border-zinc-200/70 p-4 dark:border-zinc-800">
              <div className="font-semibold">Base de dados</div>
              <div className="text-xs text-zinc-500">{status.db}</div>
            </div>
          </div>
        ) : (
          <div className="text-zinc-500">Sem dados.</div>
        )}
      </section>
    </div>
  );
}
