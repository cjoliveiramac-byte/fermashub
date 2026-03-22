/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import toast from "react-hot-toast";

export default function EditarPerfilPage() {
  const router = useRouter();
  const { data } = useSession();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name || "");
      setImage(data.user.image || "");
      setBio(data.user.bio || "");
      setLocation(data.user.location || "");
    }
  }, [data?.user]);

  const handleImageChange = async (event) => {
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
        setError(payload?.error || "Falha ao enviar imagem.");
        return;
      }
      if (payload.mediaType !== "IMAGE") {
        setError("Seleciona uma imagem valida.");
        return;
      }
      setImage(payload.url);
    } catch (err) {
      setError("Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image, bio, location }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload?.error || "Falha ao atualizar.");
        setLoading(false);
        return;
      }

      toast.success("Perfil atualizado");
      router.push(`/perfil/${data?.user?.username || "dev"}`);
    } catch (err) {
      setError("Falha ao atualizar.");
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
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <h1 className="text-lg font-semibold">Editar perfil</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Atualiza o nome e a foto do perfil.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Nome"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950">
                  {image ? (
                    <img
                      src={image}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                      Sem foto
                    </div>
                  )}
                </div>
                <label className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer">
                  {uploading ? "A enviar..." : "Adicionar foto"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
              <input
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Localizacao"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />

              {error ? (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  onClick={() => router.back()}
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
        </main>
      </div>
    </div>
  );
}
