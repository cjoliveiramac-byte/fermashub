import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { realtime } from "@/lib/realtime";

export const runtime = "nodejs";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return new Response("conversationId obrigatorio", { status: 400 });
  }

  const membership = await prisma.conversationMember.findFirst({
    where: { conversationId, userId: session.user.id },
  });
  if (!membership && session.user.role !== "developer") {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event, data) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const onMessage = (payload) => {
        if (payload?.conversationId === conversationId) {
          sendEvent("message", payload.message);
        }
      };

      const onTyping = (payload) => {
        if (payload?.conversationId === conversationId) {
          sendEvent("typing", payload);
        }
      };

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(":keep-alive\n\n"));
      }, 15000);

      realtime.on("message", onMessage);
      realtime.on("typing", onTyping);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        realtime.off("message", onMessage);
        realtime.off("typing", onTyping);
        controller.close();
      });

      sendEvent("ready", { ok: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
