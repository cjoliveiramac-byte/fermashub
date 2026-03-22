import Link from "next/link";
import { getServerSession } from "next-auth";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import PostCard from "@/components/PostCard";
import StoryHighlight from "@/components/StoryHighlight";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "user";
  const canPost = role === "developer" || role === "moderator";
  const [posts, users] = await Promise.all([
    prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const postIds = posts.map((post) => post.id);
  const [likes, comments] = await Promise.all([
    postIds.length
      ? prisma.like.findMany({ where: { postId: { in: postIds } } })
      : [],
    postIds.length
      ? prisma.comment.findMany({ where: { postId: { in: postIds } } })
      : [],
  ]);

  const likesCount = likes.reduce((acc, like) => {
    acc[like.postId] = (acc[like.postId] || 0) + 1;
    return acc;
  }, {});
  const commentsCount = comments.reduce((acc, comment) => {
    acc[comment.postId] = (acc[comment.postId] || 0) + 1;
    return acc;
  }, {});

  const enriched = posts.map((post) => ({
    ...post,
    likesCount: likesCount[post.id] || 0,
    commentsCount: commentsCount[post.id] || 0,
    authorUsername: post.authorUsername,
  }));

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />

        <main className="flex flex-1 flex-col items-center gap-6">
          <section className="w-full max-w-[600px] rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/explorar"
                className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:border-[var(--fh-green)] dark:border-zinc-700 dark:text-zinc-300"
              >
                Explorar
              </Link>
              <Link
                href="/grupos"
                className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:border-[var(--fh-green)] dark:border-zinc-700 dark:text-zinc-300"
              >
                Grupos
              </Link>
              {canPost ? (
                <>
                  <Link
                    href="/posts/novo"
                    className="rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Criar post
                  </Link>
                  <Link
                    href="/eventos/novo"
                    className="rounded-full border border-[var(--fh-green)]/40 px-4 py-2 text-xs font-semibold text-[var(--fh-green)]"
                  >
                    Criar evento
                  </Link>
                </>
              ) : null}
            </div>
          </section>

          <section className="w-full max-w-[600px] rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {users.length === 0 ? (
                <div className="text-xs text-zinc-400">
                  Nenhum story disponível.
                </div>
              ) : (
                users.map((user) => (
                  <StoryHighlight
                    key={user.id}
                    label={user.name || user.username}
                    image={user.image}
                    initial={user.username?.[0]}
                    seen={false}
                  />
                ))
              )}
            </div>
          </section>

          <section className="w-full max-w-[600px] space-y-6">
            {enriched.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                Ainda não há posts. Cria o primeiro post na comunidade.
              </div>
            ) : (
              enriched.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
