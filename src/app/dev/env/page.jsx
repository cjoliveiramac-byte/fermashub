"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DevEnvPage() {
  const [env, setEnv] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEnv = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/env");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEnv(data);
    } catch {
      toast.error("Falha ao carregar variaveis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnv();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Variaveis de ambiente</h2>
        <p className="text-sm text-zinc-500">
          Visualizacao segura sem expor segredos completos.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 text-sm shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-zinc-500">Carregando...</div>
        ) : env.length === 0 ? (
          <div className="text-zinc-500">Nenhuma variavel listada.</div>
        ) : (
          <div className="space-y-3">
            {env.map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-zinc-200/70 p-4 dark:border-zinc-800"
              >
                <div className="font-semibold">{item.key}</div>
                <div className="text-xs text-zinc-500">{item.value || "***"}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
