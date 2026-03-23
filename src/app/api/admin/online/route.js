import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getOnlineSnapshot } from "@/lib/presence";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !["developer", "moderator"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const online = getOnlineSnapshot({ withinMs: 120000 });
  return NextResponse.json({ online });
}
