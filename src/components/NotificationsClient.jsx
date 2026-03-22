"use client";

import { useState } from "react";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationsClient({ initialItems = [] }) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/notifications");
    if (!res.ok) {
      setItems([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST" });
    load();
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notificações</h1>
        <button
          onClick={markAllRead}
          className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
        >
          Marcar como lidas
        </button>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-zinc-500">A carregar...</div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
          Nenhuma notificação registada.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200/70 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {item.actor?.name || item.actor?.username || "Utilizador"}
                </span>
                <span className="text-xs text-zinc-400">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <p className="mt-2">{item.message || "Nova atividade."}</p>
              {item.postId ? (
                <a
                  href={`/posts/${item.postId}`}
                  className="mt-2 inline-block text-xs font-semibold text-[var(--fh-green)]"
                >
                  Ver conteúdo
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

