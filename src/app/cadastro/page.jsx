/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoVisible, setLogoVisible] = useState(true);
  const backgroundUrl = "/fundo-novo.jpeg";
  const brandSrc = backgroundUrl;

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Falha ao criar conta.");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Conta criada, mas o login falhou.");
        setLoading(false);
        return;
      }

      toast.success("Conta criada");
      router.push("/");
    } catch (err) {
      setError("Falha ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200/70 p-8 text-white shadow-sm dark:border-zinc-800/70">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-110 saturate-125"
          style={{ backgroundImage: `url("${backgroundUrl}")` }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white text-white flex items-center justify-center font-semibold border border-zinc-200/70 dark:border-zinc-800/70 dark:bg-zinc-950">
            {logoVisible ? (
              <img
                src={brandSrc}
                alt="FermasHub"
                className="h-full w-full object-cover"
                onError={() => setLogoVisible(false)}
              />
            ) : (
              <span>F</span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold">Criar conta</h1>
            <p className="mt-1 text-xs text-zinc-300">
              Rede privada da Associação do Colégio Fermas
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            disabled={loading}
            required
          />
          <input
            className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={loading}
            required
          />
          <input
            className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            disabled={loading}
            required
          />
          <input
            className="w-full rounded-xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Confirmar senha"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            disabled={loading}
            required
          />
          {error ? (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--fh-green)] py-2 text-sm font-semibold text-white"
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-[11px] text-zinc-300">OU</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="mt-4 w-full rounded-full border border-white/40 py-2 text-sm font-semibold text-white transition hover:border-[var(--fh-green)] hover:text-[var(--fh-green)]"
        >
          Criar conta com Google
        </button>

        <div className="mt-4 text-center text-xs text-zinc-300">
          Já tens conta?{" "}
          <a href="/login" className="font-semibold text-[var(--fh-green)]">
            Fazer login
          </a>
        </div>
        </div>
      </div>
    </div>
  );
}
