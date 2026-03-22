import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default function ExplorarPage() {
  const postsPromise = prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const likesPromise = prisma.like.findMany();

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Explorar</h1>
          </div>
          <ExploreList postsPromise={postsPromise} likesPromise={likesPromise} />
        </main>
      </div>
    </div>
  );
}

async function ExploreList({ postsPromise, likesPromise }) {
  const [posts, likes] = await Promise.all([postsPromise, likesPromise]);

  const likesCount = likes.reduce((acc, like) => {
    acc[like.postId] = (acc[like.postId] || 0) + 1;
    return acc;
  }, {});

  const enriched = posts
    .map((post) => ({
      ...post,
      likesCount: likesCount[post.id] || 0,
      commentsCount: 0,
    }))
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          Sem conteudo para explorar neste momento.
        </div>
      ) : (
        enriched.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
