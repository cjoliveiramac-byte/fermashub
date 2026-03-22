import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = normalize(body?.title);
  const description = normalize(body?.description);
  const location = normalize(body?.location);
  const dateValue = body?.date ? new Date(body.date) : null;

  if (!title || !description || !location || !dateValue) {
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

  const event = await prisma.event.create({
    data: {
      title,
      description,
      location,
      date: dateValue,
      createdById: session.user.id,
      createdBy,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
