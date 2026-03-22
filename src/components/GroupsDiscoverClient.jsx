/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function GroupsDiscoverClient() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    bannerUrl: "",
    isPublic: true,
  });

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGroups(data);
    } catch {
      toast.error("Falha ao carregar grupos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Nome do grupo obrigatorio.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erro");
      }
      toast.success("Grupo criado.");
      setForm({ name: "", description: "", bannerUrl: "", isPublic: true });
      loadGroups();
    } catch (error) {
      toast.error(error.message || "Falha ao criar grupo.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (event, id) => {
    event.preventDefault();
    const res = await fetch(`/api/groups/${id}/join`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error || "Falha ao entrar.");
      return;
    }
    toast.success("Entraste no grupo.");
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Grupos</h1>
            <p className="text-sm text-zinc-500">
              Descobre comunidades e cria o teu próprio espaço.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Nome do grupo"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <input
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Descrição curta"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <input
            value={form.bannerUrl}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, bannerUrl: event.target.value }))
            }
            placeholder="URL do banner"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isPublic: event.target.checked }))
                }
                className="h-4 w-4"
              />
              Grupo público
            </label>
            <button
              onClick={handleCreate}
              className="ml-auto rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
              disabled={creating}
            >
              {creating ? "A criar..." : "Criar grupo"}
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          A carregar grupos...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          Nenhum grupo público disponível.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/grupos/${group.id}`}
              className="group relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-sm transition hover:border-[var(--fh-green)] dark:border-zinc-800/70 dark:bg-zinc-950"
            >
              <div className="h-32 w-full overflow-hidden">
                <img
                  src={group.bannerUrl || "/fermas-bg.png"}
                  alt={group.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{group.name}</div>
                  <span className="rounded-full bg-[var(--fh-green)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--fh-green)]">
                    {group.membersCount} membros
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {group.description || "Sem descrição."}
                </p>
                <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{group.isPublic ? "Público" : "Privado"}</span>
                  <button
                    onClick={(event) => handleJoin(event, group.id)}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] font-semibold text-zinc-600"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
