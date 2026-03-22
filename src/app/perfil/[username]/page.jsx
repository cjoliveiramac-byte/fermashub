/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import ProfileActions from "@/components/ProfileActions";
import ProfileAdminActions from "@/components/ProfileAdminActions";

export const dynamic = "force-dynamic";

export default async function PerfilPage({ params }) {
  const resolvedParams =
    typeof params?.then === "function" ? await params : params;
  const usernameParam = resolvedParams?.username;
  if (!usernameParam) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  let profileUser = null;
  let posts = [];

  try {
    profileUser = await prisma.user.findUnique({
      where: { username: usernameParam },
    });
  } catch (error) {
    console.error("perfil find user error", error);
  }

  if (!profileUser) {
    try {
      profileUser = await prisma.user.findUnique({
        where: { email: usernameParam },
      });
    } catch (error) {
      console.error("perfil find email error", error);
    }
  }

  if (!profileUser) {
    notFound();
  }

  const safeUsername =
    profileUser.username || profileUser.email?.split("@")[0] || "utilizador";
  const displayName = (profileUser.name || safeUsername)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const authorUsername = profileUser.username || usernameParam;

  try {
    posts = await prisma.post.findMany({
      where: { authorUsername },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("perfil posts error", error);
    posts = [];
  }

  const isOwner =
    (session?.user?.email && session.user.email === profileUser.email) ||
    session?.user?.username === safeUsername ||
    session?.user?.username === usernameParam;
  const viewerRole = session?.user?.role || "user";
  const canPost = ["developer", "moderator"].includes(viewerRole);
  const canModerate =
    !isOwner && ["developer", "moderator"].includes(viewerRole);

  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: profileUser.id } }),
    prisma.follow.count({ where: { followerId: profileUser.id } }),
  ]);

  const isFollowing = session?.user
    ? !!(await prisma.follow.findFirst({
        where: {
          followerId: session.user.id,
          followingId: profileUser.id,
        },
      }))
    : false;

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />

        <main className="flex-1">
          <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-[var(--fh-green)] text-3xl font-semibold text-white">
                {profileUser.image ? (
                  <img
                    src={profileUser.image}
                    alt={safeUsername}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  safeUsername.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold">{displayName}</h1>
                  <span className="text-sm text-zinc-500">
                    @{safeUsername}
                  </span>
                  {isOwner ? (
                    <Link
                      href="/perfil/editar"
                      className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium dark:border-zinc-700"
                    >
                      Editar perfil
                    </Link>
                  ) : (
                    <ProfileActions
                      userId={profileUser.id}
                      initialIsFollowing={isFollowing}
                    />
                  )}
                </div>
                <div className="mt-4 flex gap-6 text-sm">
                  <span>
                    <strong>{posts.length}</strong> publicacoes
                  </span>
                  <span>
                    <strong>{followersCount}</strong> seguidores
                  </span>
                  <span>
                    <strong>{followingCount}</strong> seguindo
                  </span>
                </div>
                <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-zinc-400">{profileUser.email}</p>
                  {profileUser.bio ? <p>{profileUser.bio}</p> : null}
                  {profileUser.website ? (
                    <a
                      href={profileUser.website}
                      className="text-xs font-semibold text-[var(--fh-green)]"
                    >
                      {profileUser.website}
                    </a>
                  ) : null}
                </div>
                {canModerate ? (
                  <ProfileAdminActions
                    userId={profileUser.id}
                    viewerRole={viewerRole}
                    currentRole={profileUser.role}
                  />
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Posts</h2>
              {isOwner && canPost ? (
                <Link
                  href="/posts/novo"
                  className="text-xs font-semibold text-[var(--fh-green)]"
                >
                  Criar post
                </Link>
              ) : null}
            </div>

            {posts.length === 0 ? (
              <Link
                href={isOwner && canPost ? "/posts/novo" : "/posts"}
                className="mt-4 block rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500 transition hover:border-[var(--fh-green)] dark:border-zinc-800 dark:bg-zinc-950"
              >
                Este utilizador ainda não publicou nenhum post.{" "}
                <span className="font-semibold text-[var(--fh-green)]">
                  {isOwner && canPost ? "Criar post" : "Ver posts"}
                </span>
              </Link>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950"
                  >
                    {post.mediaUrl ? (
                      <img
                        src={post.mediaUrl}
                        alt={post.title || post.content || "post"}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-100 p-4 text-center text-xs text-zinc-500 dark:bg-zinc-900">
                        {post.content.slice(0, 80)}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

