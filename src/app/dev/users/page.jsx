"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const roles = ["USER", "MODERATOR", "DEVELOPER"];

export default function DevUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  const loadUsers = useCallback(async (term = "") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dev/users?search=${encodeURIComponent(term)}`
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

  const handleCreate = async () => {
    if (!form.email || !form.password) {
      toast.error("Email e senha sao obrigatorios.");
      return;
    }
    try {
      const res = await fetch("/api/dev/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success("Utilizador criado.");
      setForm({ name: "", email: "", password: "", role: "USER" });
      loadUsers(search);
    } catch (error) {
      toast.error(error.message || "Falha ao criar utilizador.");
    }
  };

  const handleRole = async (id, role) => {
    const ok = confirm(`Alterar role para ${role}?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/dev/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success("Role atualizada.");
      loadUsers(search);
    } catch (error) {
      toast.error(error.message || "Falha ao atualizar role.");
    }
  };

  const handleStatus = async (id, status) => {
    let banReason = "";
    let banDays = 0;
    if (status === "BANNED") {
      banReason = prompt("Motivo do ban?") || "Sem motivo definido.";
      banDays = Number(prompt("Dias de ban (0 = indefinido):") || 0);
    }
    try {
      const res = await fetch(`/api/dev/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, banReason, banDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success("Status atualizado.");
      loadUsers(search);
    } catch (error) {
      toast.error(error.message || "Falha ao atualizar status.");
    }
  };

  const handleDelete = async (id) => {
    const ok = confirm("Remover utilizador permanentemente?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/dev/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success("Utilizador removido.");
      loadUsers(search);
    } catch (error) {
      toast.error(error.message || "Falha ao remover.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Gestao de utilizadores</h2>
        <p className="text-sm text-zinc-500">
          Criar, editar roles e gerir suspensoes.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nome"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <input
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            placeholder="Email"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <input
            value={form.password}
            type="password"
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            placeholder="Senha"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCreate}
          className="mt-3 rounded-xl bg-[var(--fh-green)] px-4 py-2 text-sm font-semibold text-white"
        >
          Criar utilizador
        </button>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar..."
            className="w-56 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
            <button
              onClick={() => loadUsers(search)}
              className="rounded-full bg-[var(--fh-green)] px-4 py-1.5 text-xs font-semibold text-white"
            >
              Buscar
            </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-zinc-500">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-zinc-500">Nenhum utilizador.</div>
          ) : (
            <div className="space-y-3 text-sm">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-zinc-200/70 p-4 dark:border-zinc-800"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold">
                        {user.name || user.username}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {user.email} • {user.role} • {user.status}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Criado em {formatDate(user.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          handleRole(user.id, event.target.value)
                        }
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      {user.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleStatus(user.id, "BANNED")}
                          className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-400"
                        >
                          Banir
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatus(user.id, "ACTIVE")}
                          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-200"
                        >
                          Reativar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-400"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                  {user.status === "BANNED" ? (
                    <div className="mt-2 text-xs text-red-400">
                      Banido ate {formatDate(user.banExpiresAt) || "indefinido"} •{" "}
                      {user.banReason || "Sem motivo"}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
