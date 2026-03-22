import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 40 * 1024 * 1024;
const MAX_FILE = 15 * 1024 * 1024;

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Ficheiro obrigatorio." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isFile = !isImage && !isVideo;

  const maxSize = isVideo ? MAX_VIDEO : isImage ? MAX_IMAGE : MAX_FILE;
  if (buffer.length > maxSize) {
    return NextResponse.json(
      { error: "Ficheiro demasiado grande." },
      { status: 413 }
    );
  }

  const ext =
    path.extname(file.name || "") ||
    (isImage ? ".png" : isVideo ? ".mp4" : ".bin");
  const fileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return NextResponse.json({
    url: `/uploads/${fileName}`,
    mediaType: isVideo ? "VIDEO" : isImage ? "IMAGE" : "FILE",
    mediaName: file.name || fileName,
  });
}
