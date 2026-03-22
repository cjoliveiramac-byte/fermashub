import Link from "next/link";
import { notFound } from "next/navigation";
import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const isYoutube = (url) => url.includes("youtube.com") || url.includes("youtu.be");

const getYoutubeEmbed = (url) => {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu.be\/)([a-zA-Z0-9_-]{6,})/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}`;
};

export default async function VideoPage({ params }) {
  const resolvedParams =
    typeof params?.then === "function" ? await params : params;
  const videoId = resolvedParams?.id;
  if (!videoId) {
    notFound();
  }
  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) {
    notFound();
  }

  const embedUrl = isYoutube(video.url) ? getYoutubeEmbed(video.url) : null;

  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 justify-center">
          <article className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500">
              {video.createdBy} - {formatDate(video.createdAt)}
            </div>
            <h1 className="mt-2 text-2xl font-semibold">{video.title}</h1>
            <div className="mt-4">
              {embedUrl ? (
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70">
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={video.title}
                  />
                </div>
              ) : (
                <a
                  href={video.url}
                  className="text-sm font-semibold text-[var(--fh-green)]"
                >
                  Abrir video
                </a>
              )}
            </div>
            <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
              {video.description}
            </p>

            <div className="mt-6">
              <Link
                href="/videos"
                className="text-xs font-semibold text-[var(--fh-green)]"
              >
                Voltar aos videos
              </Link>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
