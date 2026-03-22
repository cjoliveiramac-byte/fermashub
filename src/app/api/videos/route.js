import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(videos);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["developer", "moderator"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const title = normalize(body?.title);
  const description = normalize(body?.description);
  const url = normalize(body?.url);

  if (!title || !description || !url) {
    return NextResponse.json(
      { error: "Todos os campos sao obrigatorios." },
      { status: 400 }
    );
  }

  const createdBy =
    session.user.name ||
    session.user.username ||
    session.user.email?.split("@")[0] ||
    "user";

  const video = await prisma.video.create({
    data: {
      title,
      description,
      url,
      createdById: session.user.id,
      createdBy,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
