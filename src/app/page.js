import Image from "next/image";
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

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "user";
  const canPost = role === "developer" || role === "moderator";
  const [posts, events, videos] = await Promise.all([
    prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.event.findMany({ orderBy: { date: "asc" }, take: 3 }),
    prisma.video.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />

        <main className="flex flex-1 flex-col gap-8">
          <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Posts recentes</h2>
              <Link
                href="/posts"
                className="text-xs font-semibold text-[var(--fh-green)]"
              >
                Ver todos
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {posts.length === 0 ? (
                <div className="block rounded-xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800">
                  Nenhum post ainda.{" "}
                  {canPost ? (
                    <Link
                      href="/posts/novo"
                      className="font-semibold text-[var(--fh-green)]"
                    >
                      Criar primeiro post
                    </Link>
                  ) : null}
                </div>
              ) : (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="block rounded-xl border border-zinc-200/70 p-4 transition hover:border-[var(--fh-green)] dark:border-zinc-800"
                  >
                    <div className="text-sm font-semibold">
                      {post.title || "Post"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {post.authorName} - {formatDate(post.createdAt)}
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {post.content.slice(0, 140)}...
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Próximos eventos</h2>
              <Link
                href="/eventos"
                className="text-xs font-semibold text-[var(--fh-green)]"
              >
                Ver todos
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {events.length === 0 ? (
                <div className="block rounded-xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800">
                  Nenhum evento marcado.{" "}
                  {canPost ? (
                    <Link
                      href="/eventos/novo"
                      className="font-semibold text-[var(--fh-green)]"
                    >
                      Criar evento
                    </Link>
                  ) : null}
                </div>
              ) : (
                events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.id}`}
                    className="block rounded-xl border border-zinc-200/70 p-4 transition hover:border-[var(--fh-green)] dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-900">
                        <Image
                          src="/got-monday.png"
                          alt="evento"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {event.title}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {event.location} - {formatDate(event.date)}
                        </div>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                          {event.description.slice(0, 140)}...
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Vídeos recentes</h2>
              <Link
                href="/videos"
                className="text-xs font-semibold text-[var(--fh-green)]"
              >
                Ver todos
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {videos.length === 0 ? (
                <div className="block rounded-xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800">
                  Nenhum vídeo publicado.{" "}
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
                videos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/videos/${video.id}`}
                    className="block rounded-xl border border-zinc-200/70 p-4 transition hover:border-[var(--fh-green)] dark:border-zinc-800"
                  >
                    <div className="text-sm font-semibold">{video.title}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {video.createdBy} - {formatDate(video.createdAt)}
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {video.description.slice(0, 140)}...
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

