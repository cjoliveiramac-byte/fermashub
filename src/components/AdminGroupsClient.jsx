"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function AdminGroupsClient() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groups");
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

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Grupos</h2>
            <p className="text-sm text-zinc-500">
              Visao geral das comunidades criadas na plataforma.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-sm text-zinc-500">Carregando...</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-zinc-500">Sem grupos.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-zinc-200/70 p-4 text-sm shadow-sm dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{group.name}</div>
                    <div className="text-xs text-zinc-500">
                      {group.isPublic ? "Publico" : "Privado"} •{" "}
                      {group.membersCount} membros
                    </div>
                  </div>
                  <a
                    href={`/grupos/${group.id}`}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600"
                  >
                    Abrir grupo
                  </a>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {group.description || "Sem descricao."}
                </p>
                <div className="mt-2 text-[10px] text-zinc-400">
                  Criado em {formatDate(group.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
