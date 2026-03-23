"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function PresenceBeacon() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    let active = true;
    const ping = async () => {
      if (!active) return;
      try {
        await fetch("/api/messages/presence", { method: "POST" });
      } catch {
        // Ignore presence errors.
      }
    };

    ping();
    const intervalId = setInterval(ping, 45000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [status]);

  return null;
}
