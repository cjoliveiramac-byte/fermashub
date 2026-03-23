import Image from "next/image";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-gradient-to-r from-[var(--fh-green)]/10 via-white/80 to-[var(--fh-yellow)]/10 backdrop-blur dark:border-zinc-800/70 dark:from-[var(--fh-green)]/15 dark:via-zinc-950/80 dark:to-[var(--fh-yellow)]/15">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 overflow-hidden rounded-xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <Image
              src="/fundo-novo.jpeg"
              alt="FermasHub"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">FermasHub</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Rede privada
            </div>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-3">
          <form action="/posts" method="get" className="relative">
            <input
              name="q"
              className="h-10 w-64 rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-700 outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Pesquisar"
            />
          </form>
          <Link
            href="/posts"
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-[var(--fh-green)] hover:text-[var(--fh-green)] dark:border-zinc-700 dark:text-zinc-300"
          >
            Posts
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
