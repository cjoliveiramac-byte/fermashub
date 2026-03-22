import Link from "next/link";
import { getServerSession } from "next-auth";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function PostsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "user";
  const canPost = role === "developer" || role === "moderator";
  const query = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const where = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { authorName: { contains: query, mode: "insensitive" } },
        ],
      }
    : undefined;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

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
  }));

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Posts</h1>
            {canPost ? (
              <Link
                href="/posts/novo"
                className="rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
              >
                Novo post
              </Link>
            ) : (
              <span className="text-xs text-zinc-400">
                Publicacao apenas para moderadores.
              </span>
            )}
          </div>

          {enriched.length === 0 ? (
            <div className="block rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              {query
                ? "Nenhum post encontrado para esta pesquisa."
                : "Nenhum post criado ainda."}{" "}
              {canPost ? (
                <Link
                  href="/posts/novo"
                  className="font-semibold text-[var(--fh-green)]"
                >
                  Criar post
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-6">
              {enriched.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
