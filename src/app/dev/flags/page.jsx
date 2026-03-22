"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DevFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  const loadFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/flags");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFlags(data);
    } catch {
      toast.error("Falha ao carregar flags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleCreate = async () => {
    if (!name) return;
    try {
      const res = await fetch("/api/dev/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, enabled: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success("Flag criada.");
      setName("");
      loadFlags();
    } catch (error) {
      toast.error(error.message || "Falha ao criar.");
    }
  };

  const toggleFlag = async (flag) => {
    try {
      const res = await fetch(`/api/dev/flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      if (!res.ok) throw new Error();
      toast.success("Flag atualizada.");
      loadFlags();
    } catch {
      toast.error("Falha ao atualizar.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Feature Flags</h2>
        <p className="text-sm text-zinc-500">
          Ative ou desative funcionalidades em tempo real.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-zinc-500">
              Nova flag
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ex: chat_publico"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-[var(--fh-green)] px-4 py-2 text-sm font-semibold text-white"
          >
            Criar flag
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 text-sm shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-zinc-500">Carregando...</div>
        ) : flags.length === 0 ? (
          <div className="text-zinc-500">Nenhuma flag criada.</div>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200/70 p-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold">{flag.name}</div>
                  <div className="text-xs text-zinc-500">
                    {flag.enabled ? "Ativa" : "Desativada"}
                  </div>
                </div>
                <button
                  onClick={() => toggleFlag(flag)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-[var(--fh-green)] dark:border-zinc-700 dark:text-zinc-200"
                >
                  {flag.enabled ? "Desativar" : "Ativar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
