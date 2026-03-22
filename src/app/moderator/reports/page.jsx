"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function ModeratorReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("OPEN");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/moderation/reports?status=${filter}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReports(data);
    } catch {
      toast.error("Falha ao carregar denúncias.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDecision = async (id, decision) => {
    const ok = confirm(`Confirmar ${decision.toLowerCase()}?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/moderation/reports/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Erro");
      }
      toast.success("Denúncia atualizada.");
      loadReports();
    } catch (error) {
      toast.error(error.message || "Falha ao atualizar denúncia.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Denúncias</h2>
            <p className="text-sm text-zinc-500">
              Revise e finalize denúncias pendentes.
            </p>
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="OPEN">Abertas</option>
            <option value="APPROVED">Aprovadas</option>
            <option value="REJECTED">Rejeitadas</option>
            <option value="DELETED">Excluídas</option>
          </select>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-sm text-zinc-500">Carregando...</div>
        ) : reports.length === 0 ? (
          <div className="text-sm text-zinc-500">Sem denúncias.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-zinc-200/70 p-4 text-sm dark:border-zinc-800"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold">
                      {report.type} - prioridade {report.priority}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {formatDate(report.createdAt)} - {report.status}
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {report.reason}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDecision(report.id, "APPROVE")}
                      className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-[var(--fh-green)] dark:border-zinc-700 dark:text-zinc-200"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleDecision(report.id, "REJECT")}
                      className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-amber-400 dark:border-zinc-700 dark:text-zinc-200"
                    >
                      Rejeitar
                    </button>
                    <button
                      onClick={() => handleDecision(report.id, "DELETE")}
                      className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-400"
                    >
                      Excluir conteúdo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

