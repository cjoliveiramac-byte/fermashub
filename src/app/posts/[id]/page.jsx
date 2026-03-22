import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import PostDetailClient from "@/components/PostDetailClient";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }) {
  const resolvedParams =
    typeof params?.then === "function" ? await params : params;
  const postId = resolvedParams?.id;
  if (!postId) {
    notFound();
  }
  const session = await getServerSession(authOptions);
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    notFound();
  }

  const [likesCount, comments] = await Promise.all([
    prisma.like.count({ where: { postId: post.id } }),
    prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const liked = session?.user
    ? !!(await prisma.like.findFirst({
        where: { postId: post.id, userId: session.user.id },
      }))
    : false;

  let commentsWithLikes = comments;
  if (comments.length) {
    const ids = comments.map((comment) => comment.id);
    const likes = await prisma.commentLike.findMany({
      where: { commentId: { in: ids } },
    });
    const likesCountMap = likes.reduce((acc, like) => {
      acc[like.commentId] = (acc[like.commentId] || 0) + 1;
      return acc;
    }, {});

    const likedSet = new Set(
      session?.user
        ? likes
            .filter((like) => like.userId === session.user.id)
            .map((like) => like.commentId)
        : []
    );

    commentsWithLikes = comments.map((comment) => ({
      ...comment,
      likesCount: likesCountMap[comment.id] || 0,
      liked: likedSet.has(comment.id),
    }));
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 justify-center">
          <PostDetailClient
            post={{
              ...post,
              likesCount,
              liked,
            }}
            initialComments={commentsWithLikes}
          />
        </main>
      </div>
    </div>
  );
}
