"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function AdminSettingsClient({
  initialSettings,
  initialFlags = [],
  initialLogs = [],
  initialRole = "user",
}) {
  const { data } = useSession();
  const role = data?.user?.role || initialRole || "user";
  const canEdit = role === "developer";
  const [settings, setSettings] = useState(initialSettings);
  const [flags, setFlags] = useState(initialFlags);
  const [logs, setLogs] = useState(initialLogs);

  const loadSettings = async () => {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) return;
    const data = await res.json();
    setSettings(data);
  };

  const loadFlags = async () => {
    const res = await fetch("/api/admin/feature-flags");
    if (!res.ok) return;
    const data = await res.json();
    setFlags(data);
  };

  const loadLogs = async () => {
    if (role !== "developer") return;
    const res = await fetch("/api/admin/logs");
    if (!res.ok) return;
    const data = await res.json();
    setLogs(data.slice(0, 20));
  };

  const handleSaveSettings = async () => {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformName: settings?.platformName,
        maintenanceMode: settings?.maintenanceMode,
      }),
    });
    if (!res.ok) {
      toast.error("Falha ao guardar.");
      return;
    }
    toast.success("Configurações atualizadas.");
    loadSettings();
  };

  const handleToggleFlag = async (flag) => {
    const res = await fetch("/api/admin/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: flag.name, enabled: !flag.enabled }),
    });
    if (!res.ok) {
      toast.error("Falha ao atualizar.");
      return;
    }
    loadFlags();
  };

  if (!settings) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        A carregar...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">Configurações da plataforma</h3>
        {!canEdit ? (
          <div className="mt-2 text-xs text-zinc-400">
            Apenas developers podem editar estas configurações.
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-xs text-zinc-500">
            Nome da plataforma
            <input
              value={settings.platformName || ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  platformName: event.target.value,
                }))
              }
              disabled={!canEdit}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            Modo manutenção
            <input
              type="checkbox"
              checked={Boolean(settings.maintenanceMode)}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  maintenanceMode: event.target.checked,
                }))
              }
              disabled={!canEdit}
              className="h-4 w-4"
            />
          </label>
        </div>
        <button
          onClick={handleSaveSettings}
          className="mt-4 rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
          disabled={!canEdit}
        >
          Guardar configurações
        </button>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">Funcionalidades ativas</h3>
        {!canEdit ? (
          <div className="mt-2 text-xs text-zinc-400">
            Apenas developers podem alterar estas flags.
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {flags.length === 0 ? (
            <div className="text-xs text-zinc-400">Sem flags.</div>
          ) : (
            flags.map((flag) => (
              <button
                key={flag.id}
                onClick={() => handleToggleFlag(flag)}
                className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-xs text-zinc-600 transition hover:border-[var(--fh-green)] dark:border-zinc-700 dark:text-zinc-300"
                disabled={!canEdit}
              >
                {flag.name}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    flag.enabled
                      ? "bg-[var(--fh-green)]/15 text-[var(--fh-green)]"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}
                >
                  {flag.enabled ? "Ativo" : "Desativado"}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <h3 className="text-sm font-semibold">Logs de segurança</h3>
        <div className="mt-4 space-y-2 text-xs text-zinc-500">
          {role !== "developer" ? (
            <div className="text-xs text-zinc-400">
              Apenas developers podem ver logs completos.
            </div>
          ) : logs.length === 0 ? (
            <div className="text-xs text-zinc-400">Sem logs.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200/70 px-3 py-2 dark:border-zinc-800"
              >
                <span>{log.action}</span>
                <span>{new Date(log.createdAt).toISOString().slice(0, 10)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
