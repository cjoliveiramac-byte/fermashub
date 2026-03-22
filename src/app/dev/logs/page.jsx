"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 19).replace("T", " ");
};

export default function DevLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = useCallback(async (nextFilter = "") => {
    setLoading(true);
    try {
      const query = nextFilter ? `?action=${nextFilter}` : "";
      const res = await fetch(`/api/dev/logs${query}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data);
    } catch {
      toast.error("Falha ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Logs do sistema</h2>
            <p className="text-sm text-zinc-500">
              Auditoria completa de eventos e acoes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              placeholder="Filtrar por acao"
              className="w-48 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
            <button
              onClick={() => loadLogs(actionFilter)}
              className="rounded-full bg-[var(--fh-green)] px-4 py-1.5 text-xs font-semibold text-white"
            >
              Filtrar
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-sm text-zinc-500">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-zinc-500">Sem logs.</div>
        ) : (
          <div className="space-y-3 text-sm">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-zinc-200/70 p-4 dark:border-zinc-800"
              >
                <div className="font-semibold">{log.action}</div>
                <div className="text-xs text-zinc-500">
                  {formatDate(log.createdAt)} • {log.userId}
                </div>
                {log.metadata ? (
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
                    {log.metadata}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
