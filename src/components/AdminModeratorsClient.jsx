"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function AdminModeratorsClient() {
  const { data } = useSession();
  const role = data?.user?.role || "user";
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error("Falha ao carregar utilizadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    if (role !== "developer") return;
    try {
      const res = await fetch("/api/admin/logs");
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.slice(0, 25));
    } catch {}
  }, [role]);

  useEffect(() => {
    loadUsers();
    loadLogs();
  }, [loadUsers, loadLogs]);

  const moderators = useMemo(
    () => users.filter((user) => user.role === "MODERATOR"),
    [users]
  );
  const regulars = useMemo(
    () => users.filter((user) => user.role === "USER"),
    [users]
  );

  const handleRole = async (userId, nextRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erro");
      }
      toast.success("Permissao atualizada.");
      loadUsers();
      loadLogs();
    } catch (error) {
      toast.error(error.message || "Falha ao atualizar.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Moderadores</h2>
            <p className="text-sm text-zinc-500">
              Promova utilizadores e acompanhe o histórico de ações.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">Moderadores atuais</h3>
          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="text-xs text-zinc-400">A carregar...</div>
            ) : moderators.length === 0 ? (
              <div className="text-xs text-zinc-400">Sem moderadores.</div>
            ) : (
              moderators.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200/70 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <div>
                    <div className="font-semibold">
                      {user.name || user.username}
                    </div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </div>
                  <button
                    onClick={() => handleRole(user.id, "USER")}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500"
                  >
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">Promover utilizadores</h3>
          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="text-xs text-zinc-400">A carregar...</div>
            ) : regulars.length === 0 ? (
              <div className="text-xs text-zinc-400">Sem utilizadores.</div>
            ) : (
              regulars.slice(0, 12).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200/70 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <div>
                    <div className="font-semibold">
                      {user.name || user.username}
                    </div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </div>
                  <button
                    onClick={() => handleRole(user.id, "MODERATOR")}
                    className="rounded-full bg-[var(--fh-green)] px-3 py-1 text-xs font-semibold text-white"
                    disabled={role !== "developer"}
                  >
                    Promover
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">histórico recente</h3>
        <div className="mt-3 space-y-2 text-xs text-zinc-500">
          {role !== "developer" ? (
            <div className="text-xs text-zinc-400">
              Apenas developers podem ver logs completos.
            </div>
          ) : logs.length === 0 ? (
            <div className="text-xs text-zinc-400">Sem logs.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200/70 px-3 py-2 dark:border-zinc-800"
              >
                <span>{log.action}</span>
                <span>{formatDate(log.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

