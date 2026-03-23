"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const backgroundUrl = "/fundo%20novo.jpeg";

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Email ou senha incorretos.");
        setLoading(false);
        return;
      }

      toast.success("Login efetuado");
      router.push("/");
    } catch (err) {
      setError("Falha ao efetuar login.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="relative z-0 flex min-h-screen items-center justify-center px-4">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url("${backgroundUrl}")` }}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200/70 p-8 text-white shadow-sm dark:border-zinc-800/70">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-110 saturate-125"
          style={{ backgroundImage: `url("${backgroundUrl}")` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/30 shadow-sm">
              <Image
                src="/fundo%20novo.jpeg"
                alt="FermasHub"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Entrar no FermasHub</h1>
              <p className="text-xs text-zinc-300">
                Rede privada da Associação do Colégio Fermas
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              className="w-full rounded-xl border border-zinc-200 bg-white/95 px-4 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
            <input
              className="w-full rounded-xl border border-zinc-200 bg-white/95 px-4 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              placeholder="Senha"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />
            <p className="text-[11px] text-zinc-300">
              Moderadores e developers usam a senha especial definida pela equipa.
            </p>
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
              {loading ? "Entrando..." : "Entrar"}
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
            Entrar com Google
          </button>

          <div className="mt-4 text-center text-xs text-zinc-300">
            Não tens conta?{" "}
            <a href="/cadastro" className="font-semibold text-[var(--fh-green)]">
              Criar conta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
