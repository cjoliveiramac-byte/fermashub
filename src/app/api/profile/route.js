import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const normalize = (value) => (value || "").trim();

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = normalize(body?.name);
  const image = normalize(body?.image);
  const bio = normalize(body?.bio);
  const website = normalize(body?.website);
  const location = normalize(body?.location);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || undefined,
      image: image || undefined,
      bio: bio || undefined,
      website: website || undefined,
      location: location || undefined,
    },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    image: user.image,
    bio: user.bio,
    website: user.website,
    location: user.location,
  });
}
