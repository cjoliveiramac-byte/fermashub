"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function ProfileAdminActions({
  userId,
  viewerRole,
  currentRole = "USER",
}) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(currentRole);

  const suspendUser = async () => {
    const reason = prompt("Motivo da suspensao?") || "Sem motivo definido.";
    const days = Number(prompt("Dias de suspensao (0 = indefinido):") || 0);
    setLoading(true);
    try {
      const res = await fetch(`/api/moderation/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success("Utilizador suspenso.");
    } catch (error) {
      toast.error(error.message || "Falha ao suspender.");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dev/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success("Role atualizada.");
    } catch (error) {
      toast.error(error.message || "Falha ao atualizar role.");
    } finally {
      setLoading(false);
    }
  };

  const banUser = async () => {
    const reason = prompt("Motivo do ban?") || "Sem motivo definido.";
    const days = Number(prompt("Dias (0 = indefinido):") || 0);
    setLoading(true);
    try {
      const res = await fetch(`/api/dev/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "BANNED", banReason: reason, banDays: days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success("Utilizador banido.");
    } catch (error) {
      toast.error(error.message || "Falha ao banir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-white p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-xs font-semibold uppercase text-zinc-400">
        Acoes de moderacao
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={suspendUser}
          className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500"
          disabled={loading}
        >
          Suspender
        </button>
        {viewerRole === "developer" ? (
          <>
            <button
              onClick={banUser}
              className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500"
              disabled={loading}
            >
              Banir
            </button>
            <div className="flex items-center gap-2">
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="USER">USER</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="DEVELOPER">DEVELOPER</option>
              </select>
              <button
                onClick={updateRole}
                className="rounded-full bg-[var(--fh-green)] px-3 py-1 text-xs font-semibold text-white"
                disabled={loading}
              >
                Atualizar role
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
