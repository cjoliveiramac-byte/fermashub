"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function AdminUserDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data } = useSession();
  const role = data?.user?.role || "user";
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!params?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPayload(data);
    } catch {
      toast.error("Falha ao carregar utilizador.");
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleBan = async () => {
    const reason = prompt("Motivo do banimento?") || "Sem motivo definido.";
    const days = Number(prompt("Número de dias (0 = indefinido):") || 0);
    const res = await fetch(`/api/admin/users/${params.id}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, days }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error || "Falha ao banir.");
      return;
    }
    toast.success("Utilizador banido.");
    loadUser();
  };

  const handleSuspend = async () => {
    const reason = prompt("Motivo da suspensão?") || "Sem motivo definido.";
    const days = Number(prompt("Número de dias:") || 0);
    const res = await fetch(`/api/admin/users/${params.id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, days }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error || "Falha ao suspender.");
      return;
    }
    toast.success("Utilizador suspenso.");
    loadUser();
  };

  const handleDelete = async () => {
    const ok = confirm("Confirmar apagar conta?");
    if (!ok) return;
    const res = await fetch(`/api/admin/users/${params.id}/delete`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error || "Falha ao apagar.");
      return;
    }
    toast.success("Conta apagada.");
    router.push("/admin/users");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        A carregar...
      </div>
    );
  }

  if (!payload?.user) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        Utilizador não encontrado.
      </div>
    );
  }

  const { user, posts, reportsAgainst, activity, logs } = payload;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {user.name || user.username}
            </h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <div className="mt-2 text-xs text-zinc-500">
              @{user.username} - {user.role.toLowerCase()} - {user.status}
            </div>
            {user.status === "BANNED" ? (
              <div className="mt-2 text-xs text-red-400">
                Banido até {formatDate(user.banExpiresAt) || "indefinido"} -{" "}
                {user.banReason || "Sem motivo"}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSuspend}
              className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-500"
            >
              Suspender
            </button>
            <button
              onClick={handleBan}
              className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500"
            >
              Banir
            </button>
            {role === "developer" ? (
              <button
                onClick={handleDelete}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500"
              >
                Apagar conta
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Posts criados", value: activity?.postsCount ?? 0 },
          { label: "Comentários", value: activity?.commentsCount ?? 0 },
          { label: "Mensagens", value: activity?.messagesCount ?? 0 },
          { label: "Denúncias feitas", value: activity?.reportsBy ?? 0 },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-200/70 bg-white p-4 text-sm shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950"
          >
            <div className="text-xs uppercase text-zinc-400">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">Posts recentes</h3>
          <div className="mt-3 space-y-3">
            {posts?.length ? (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-zinc-200/70 p-3 text-sm dark:border-zinc-800"
                >
                  <div className="font-semibold">{post.title || "Post"}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {formatDate(post.createdAt)}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {post.content.slice(0, 120)}...
                  </p>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-400">Sem posts.</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <h3 className="text-sm font-semibold">Denúncias relacionadas</h3>
          <div className="mt-3 space-y-3">
            {reportsAgainst?.length ? (
              reportsAgainst.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-zinc-200/70 p-3 text-xs dark:border-zinc-800"
                >
                  <div className="font-semibold">
                    {report.type} - prioridade {report.priority}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    {formatDate(report.createdAt)} - {report.status}
                  </div>
                  <div className="mt-2 text-zinc-600">{report.reason}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-400">Sem Denúncias.</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">Histórico de atividade</h3>
        <div className="mt-3 space-y-2 text-xs text-zinc-500">
          {logs?.length ? (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200/70 px-3 py-2 dark:border-zinc-800"
              >
                <span>{log.action}</span>
                <span>{formatDate(log.createdAt)}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-zinc-400">Sem logs.</div>
          )}
        </div>
      </section>
    </div>
  );
}


