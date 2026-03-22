"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function ProfileActions({ userId, initialIsFollowing }) {
  const [isFollowing, setIsFollowing] = useState(Boolean(initialIsFollowing));
  const [loading, setLoading] = useState(false);
  const [reporting, setReporting] = useState(false);

  const toggleFollow = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setIsFollowing(Boolean(data.isFollowing));
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Por que queres denunciar este utilizador?");
    if (!reason) return;
    setReporting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "USER",
          targetId: userId,
          reason,
          priority: 1,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Denúncia enviada.");
    } catch {
      toast.error("Falha ao enviar denúncia.");
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={toggleFollow}
        className={`rounded-full px-4 py-1.5 text-sm font-medium ${
          isFollowing
            ? "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            : "bg-[var(--fh-green)] text-white"
        }`}
        disabled={loading}
      >
        {isFollowing ? "A seguir" : "Seguir"}
      </button>
      <button
        onClick={handleReport}
        className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-500"
        disabled={reporting}
      >
        Denunciar
      </button>
    </div>
  );
}
