"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function ModeratorUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadUsers = useCallback(async (term = "") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/moderation/users?search=${encodeURIComponent(term)}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error("Falha ao carregar utilizadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSuspend = async (userId) => {
    const reason = prompt("Motivo da suspensão?") || "Sem motivo definido.";
    const days = Number(prompt("Número de dias (0 = indefinido):") || 0);

    try {
      const res = await fetch(`/api/moderation/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, days }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erro");
      }
      toast.success("Utilizador suspenso.");
      loadUsers(search);
    } catch (error) {
      toast.error(error.message || "Falha ao suspender.");
    }
  };

  const handleHistory = async (userId) => {
    try {
      const res = await fetch(`/api/moderation/users/${userId}/history`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erro");
      }
      toast(
        `Histórico: ${data.reports} denúncias - ${data.logs} logs`,
        { duration: 4000 }
      );
    } catch (error) {
      toast.error(error.message || "Falha ao carregar Histórico.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Utilizadores</h2>
            <p className="text-sm text-zinc-500">
              Suspensões e Histórico basico de utilizadores.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por email ou nome"
              className="w-56 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
            <button
              onClick={() => loadUsers(search)}
              className="rounded-full bg-[var(--fh-green)] px-4 py-1.5 text-xs font-semibold text-white"
            >
              Buscar
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-sm text-zinc-500">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="text-sm text-zinc-500">Nenhum utilizador.</div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-zinc-200/70 p-4 text-sm dark:border-zinc-800"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold">
                      {user.name || user.username}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {user.email} - {user.role} - {user.status}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Criado em {formatDate(user.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleHistory(user.id)}
                      className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-200"
                    >
                      Histórico
                    </button>
                    <button
                      onClick={() => handleSuspend(user.id)}
                      className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-400"
                    >
                      Suspender
                    </button>
                  </div>
                </div>
                {user.status === "BANNED" ? (
                  <div className="mt-2 text-xs text-red-400">
                    Banido até {formatDate(user.banExpiresAt) || "indefinido"} -{" "}
                    {user.banReason || "Sem motivo"}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

