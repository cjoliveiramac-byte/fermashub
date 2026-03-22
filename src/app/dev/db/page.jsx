"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DevDbPage() {
  const [collections, setCollections] = useState([]);
  const [collection, setCollection] = useState("");
  const [where, setWhere] = useState("{}");
  const [take, setTake] = useState(20);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const res = await fetch("/api/dev/db/collections");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const names = data.map((item) => item.name);
        setCollections(names);
        setCollection(names[0] || "");
      } catch {
        toast.error("Falha ao carregar colecoes.");
      }
    };
    loadCollections();
  }, []);

  const runQuery = async () => {
    if (!collection) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dev/db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, where, take }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erro");
      }
      setResults(data);
    } catch (error) {
      toast.error(error.message || "Falha ao consultar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Explorador da base de dados</h2>
        <p className="text-sm text-zinc-500">
          Consultas seguras para inspecionar colecoes.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500">
              Colecao
            </label>
            <select
              value={collection}
              onChange={(event) => setCollection(event.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {collections.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-500">
              Limite
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={take}
              onChange={(event) => setTake(Number(event.target.value))}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={runQuery}
              className="w-full rounded-xl bg-[var(--fh-green)] px-4 py-2 text-sm font-semibold text-white"
            >
              Consultar
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-zinc-500">
            Filtro JSON (ex: {"{ \"status\": \"ACTIVE\" }"})
          </label>
          <textarea
            value={where}
            onChange={(event) => setWhere(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 text-sm shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-zinc-500">Carregando...</div>
        ) : results ? (
          <pre className="whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-200">
            {JSON.stringify(results, null, 2)}
          </pre>
        ) : (
          <div className="text-zinc-500">Sem resultados.</div>
        )}
      </section>
    </div>
  );
}
