"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

export default function UserAdminActions({ userId, role }) {
  const { data } = useSession();
  const sessionRole = data?.user?.role;
  const [loading, setLoading] = useState(false);

  const banUser = async () => {
    const reason = window.prompt("Motivo do ban:");
    if (!reason) return;
    const days = window.prompt("Dias de ban (0 = permanente):", "7");
    setLoading(true);
    try {
      await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason, days: Number(days || 0) }),
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (nextRole) => {
    setLoading(true);
    try {
      await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: nextRole }),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sessionRole || sessionRole === "user") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {sessionRole === "developer" ? (
        role === "USER" ? (
          <button
            onClick={() => updateRole("MODERATOR")}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            disabled={loading}
          >
            Promover
          </button>
        ) : role === "MODERATOR" ? (
          <button
            onClick={() => updateRole("USER")}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            disabled={loading}
          >
            Rebaixar
          </button>
        ) : null
      ) : null}
      {role === "USER" || sessionRole === "developer" ? (
        <button
          onClick={banUser}
          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"
          disabled={loading}
        >
          Banir
        </button>
      ) : null}
    </div>
  );
}
