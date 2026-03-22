/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function NovoPostPage() {
  const router = useRouter();
  const { data } = useSession();
  const role = data?.user?.role || "user";
  const canPost = role === "developer" || role === "moderator";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("IMAGE");
  const [mediaPreview, setMediaPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!content.trim() && !mediaUrl.trim()) {
        setError("Adiciona uma legenda ou um ficheiro.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, mediaUrl, mediaType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Falha ao criar post.");
        setLoading(false);
        return;
      }

      toast.success("Post criado");
      router.push(`/posts/${data.id}`);
    } catch (err) {
      setError("Falha ao criar post.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Falha ao enviar ficheiro.");
        setUploading(false);
        return;
      }
      setMediaUrl(data.url);
      setMediaType(data.mediaType || "IMAGE");
      setMediaPreview(data.url);
    } catch (err) {
      setError("Falha ao enviar ficheiro.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <h1 className="text-lg font-semibold">Novo post</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Publica uma atualização para a comunidade.
            </p>

            {!canPost ? (
              <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                Apenas moderadores e developer podem Publicar posts.
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Titulo (opcional)"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <textarea
                className="min-h-[160px] w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Escreve uma legenda ou descrição"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
              <div className="grid gap-3">
                <label className="flex flex-col gap-2 text-xs text-zinc-500">
                  Adicionar imagem ou video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                {uploading ? (
                  <div className="text-xs text-zinc-400">A enviar ficheiro...</div>
                ) : null}
                {mediaPreview ? (
                  <div className="rounded-2xl border border-zinc-200/70 p-3 text-xs text-zinc-500 dark:border-zinc-800">
                    ficheiro pronto: {mediaType}
                    <div className="mt-2">
                      {mediaType === "VIDEO" ? (
                        <video src={mediaPreview} controls className="w-full rounded-xl" />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="w-full rounded-xl object-cover" />
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  onClick={() => router.push("/posts")}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--fh-green)] px-5 py-2 text-xs font-semibold text-white"
                  disabled={loading}
                >
                  {loading ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

