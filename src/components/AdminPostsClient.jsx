"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function AdminPostsClient() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data);
    } catch {
      toast.error("Falha ao carregar posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async (id) => {
    const ok = confirm("Remover este post?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Post removido.");
      loadPosts();
    } catch {
      toast.error("Falha ao remover post.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Posts</h2>
            <p className="text-sm text-zinc-500">
              Revise publicacoes e mantenha a comunidade saudavel.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        {loading ? (
          <div className="text-sm text-zinc-500">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-zinc-500">Sem posts.</div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-zinc-200/70 p-4 text-sm dark:border-zinc-800"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold">{post.title || "Post"}</div>
                    <div className="text-xs text-zinc-500">
                      {post.authorName} • {formatDate(post.createdAt)}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {post.content.slice(0, 140)}...
                    </div>
                    <div className="mt-2 text-[10px] text-zinc-400">
                      {post.likesCount} likes • {post.commentsCount} comentarios
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/posts/${post.id}`}
                      className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600"
                    >
                      Ver
                    </a>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
