import Link from "next/link";
import { getServerSession } from "next-auth";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default async function VideosPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "user";
  const canPost = role === "developer" || role === "moderator";
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Vídeos</h1>
            {canPost ? (
              <Link
                href="/videos/novo"
                className="rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
              >
                Novo vídeo
              </Link>
            ) : (
              <span className="text-xs text-zinc-400">
                Criação apenas para moderadores.
              </span>
            )}
          </div>

          {videos.length === 0 ? (
            <div className="block rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              Nenhum vídeo publicado ainda.{" "}
              {canPost ? (
                <Link
                  href="/videos/novo"
                  className="font-semibold text-[var(--fh-green)]"
                >
                  Adicionar vídeo
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm transition hover:border-[var(--fh-green)] dark:border-zinc-800/70 dark:bg-zinc-950"
                >
                  <div className="text-sm font-semibold">{video.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {video.createdBy} - {formatDate(video.createdAt)}
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {video.description.slice(0, 180)}...
                  </p>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
