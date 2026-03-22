"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DevApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [rawKey, setRawKey] = useState("");

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/api-keys");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setKeys(data);
    } catch {
      toast.error("Falha ao carregar chaves.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/dev/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      setRawKey(data.rawKey);
      setNewKeyName("");
      toast.success("Chave criada.");
      loadKeys();
    } catch (error) {
      toast.error(error.message || "Falha ao criar chave.");
    }
  };

  const handleRevoke = async (id) => {
    const ok = confirm("Revogar esta chave?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/dev/api-keys/${id}/revoke`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("Chave revogada.");
      loadKeys();
    } catch {
      toast.error("Falha ao revogar chave.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <p className="text-sm text-zinc-500">
          Gere chaves de acesso para integracoes.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-zinc-500">
              Nome da chave
            </label>
            <input
              value={newKeyName}
              onChange={(event) => setNewKeyName(event.target.value)}
              placeholder="Ex: Integracao mobile"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-[var(--fh-green)] px-4 py-2 text-sm font-semibold text-white"
          >
            Criar chave
          </button>
        </div>
        {rawKey ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            Nova chave: <span className="font-semibold">{rawKey}</span>
            <div>Guarde agora. Esta chave não sera mostrada novamente.</div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 text-sm shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-zinc-500">Carregando...</div>
        ) : keys.length === 0 ? (
          <div className="text-zinc-500">Nenhuma chave criada.</div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200/70 p-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {key.name || "Chave"} â€¢ {key.prefix || "sem prefixo"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {key.revoked ? "Revogada" : "Ativa"}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-400"
                  disabled={key.revoked}
                >
                  {key.revoked ? "Revogada" : "Revogar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

