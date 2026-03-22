"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import toast from "react-hot-toast";

export default function NovoVideoPage() {
  const router = useRouter();
  const { data } = useSession();
  const role = data?.user?.role || "user";
  const canPublish = role === "developer" || role === "moderator";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVideoUpload = async (event) => {
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
      const payload = await res.json();
      if (!res.ok) {
        setError(payload?.error || "Falha ao enviar vídeo.");
        return;
      }
      if (payload.mediaType !== "VIDEO") {
        setError("Seleciona um vídeo válido.");
        return;
      }
      setUrl(payload.url);
    } catch (err) {
      setError("Falha ao enviar vídeo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!url) {
        setError("Seleciona um vídeo antes de guardar.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Falha ao criar vídeo.");
        setLoading(false);
        return;
      }

      toast.success("Vídeo criado");
      router.push(`/videos/${data.id}`);
    } catch (err) {
      setError("Falha ao criar vídeo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 justify-center">
          {!canPublish ? (
            <div className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
              Apenas moderadores e developers podem publicar vídeos.
            </div>
          ) : (
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <h1 className="text-lg font-semibold">Novo vídeo</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Adiciona um vídeo para a comunidade.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Título"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
              <textarea
                className="min-h-[140px] w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Descrição"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
              <div className="flex flex-col gap-3">
                <label className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer">
                  {uploading ? "A enviar..." : "Selecionar vídeo"}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {url ? (
                  <video
                    src={url}
                    className="w-full rounded-xl"
                    controls
                  />
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
                  onClick={() => router.push("/videos")}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--fh-green)] px-5 py-2 text-xs font-semibold text-white"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
          )}
        </main>
      </div>
    </div>
  );
}
