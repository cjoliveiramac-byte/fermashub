import { NextResponse } from "next/server";
import crypto from "crypto";

const normalize = (value) => (value || "").trim();

const safeEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

const getCodes = () => {
  const dev = normalize(process.env.DEV_ACCESS_CODE);
  const mods = normalize(process.env.MOD_ACCESS_CODES)
    .split(",")
    .map((item) => normalize(item))
    .filter(Boolean);
  return { dev, mods };
};

export async function POST(request) {
  const { code } = await request.json();
  const input = normalize(code);
  const { dev, mods } = getCodes();

  if (!input) {
    return NextResponse.json({ role: "user", valid: true });
  }

  if (dev && safeEqual(input, dev)) {
    return NextResponse.json({ role: "developer", valid: true });
  }

  const isMod = mods.some((mod) => safeEqual(input, mod));
  if (isMod) {
    return NextResponse.json({ role: "moderator", valid: true });
  }

  return NextResponse.json({
    role: "user",
    valid: false,
    reason: "invalid_code",
  });
}
