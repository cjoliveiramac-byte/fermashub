"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import toast from "react-hot-toast";

export default function NovoEventoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, location, date }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Falha ao criar evento.");
        setLoading(false);
        return;
      }

      toast.success("Evento criado");
      router.push(`/eventos/${data.id}`);
    } catch (err) {
      setError("Falha ao criar evento.");
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
            <h1 className="text-lg font-semibold">Novo evento</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Regista um evento para a comunidade.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Titulo"
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
              <input
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Local"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
              />
              <input
                className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
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
                  onClick={() => router.push("/eventos")}
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
