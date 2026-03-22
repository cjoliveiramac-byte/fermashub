/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function UserMenu() {
  const { data } = useSession();
  const user = data?.user;
  const roleLabels = {
    developer: "Developer",
    moderator: "Moderador",
    user: "Utilizador",
    member: "Utilizador",
  };
  const displayName = (user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Utilizador")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const handle =
    user?.username || user?.email?.split("@")[0] || "utilizador";

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-[var(--fh-green)] px-3 py-1.5 text-xs font-semibold text-white"
      >
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden rounded-full border border-[var(--fh-green)] px-2 py-1 text-[10px] font-semibold text-[var(--fh-green)] md:inline">
        {roleLabels[user.role?.toLowerCase?.()] || user.role}
      </span>
      <Link
        href={`/perfil/${user.username || "dev"}`}
        className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
      >
        <img
          src={user.image || "https://i.pravatar.cc/150?u=fermas"}
          alt={user.username || user.email || "user"}
          className="h-6 w-6 rounded-full object-cover"
        />
        <div className="leading-tight">
          <div className="font-semibold text-zinc-700 dark:text-zinc-200">
            {displayName}
          </div>
          <div className="text-[10px] text-zinc-400">@{handle}</div>
        </div>
      </Link>
      <button
        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
        onClick={handleLogout}
      >
        Sair
      </button>
    </div>
  );
}
