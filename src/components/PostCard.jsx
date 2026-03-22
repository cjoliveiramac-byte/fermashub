/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function PostCard({ post }) {
  const postId = post.id || post._id || "";
  const postUrl = postId ? `/posts/${postId}` : "/posts";
  const username =
    post.username || post.authorUsername || post.authorName || "utilizador";
  const caption = post.caption || post.content || "";
  const commentsCount = post.comments ?? post.commentsCount ?? 0;
  const avatar = post.avatar || post.authorAvatar || "";
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likes, setLikes] = useState(post.likes ?? post.likesCount ?? 0);
  const [savedTick, setSavedTick] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const mediaSrc = post.previewFile || post.mediaUrl || post.image;
  const mediaType = post.mediaType || (mediaSrc ? "IMAGE" : null);
  const heartTimer = useRef(null);

  const saved = useMemo(() => {
    const tick = savedTick;
    void tick;
    if (!postId || typeof window === "undefined") return false;
    try {
      const stored = JSON.parse(localStorage.getItem("fermas_saved") || "[]");
      return stored.includes(postId);
    } catch {
      return false;
    }
  }, [postId, savedTick]);

  useEffect(() => {
    return () => {
      if (heartTimer.current) {
        clearTimeout(heartTimer.current);
      }
    };
  }, []);

  const toggleLike = async () => {
    if (!postId) return;
    setLiked((prev) => {
      const next = !prev;
      setLikes((current) => current + (next ? 1 : -1));
      return next;
    });
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      if (!res.ok) return;
      const data = await res.json();
      setLiked(Boolean(data.liked));
      if (typeof data.likesCount === "number") {
        setLikes(data.likesCount);
      }
    } catch {
      // ignore errors
    }
  };

  const toggleSave = () => {
    if (!postId) return;
    const nextSaved = !saved;
    try {
      const stored = JSON.parse(localStorage.getItem("fermas_saved") || "[]");
      const next = nextSaved
        ? Array.from(new Set([...stored, postId]))
        : stored.filter((id) => id !== postId);
      localStorage.setItem("fermas_saved", JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setSavedTick((value) => value + 1);
    return;
  };

  const handleShare = async () => {
    if (!postUrl) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${postUrl}`
        : postUrl;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.caption || "Post", url });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore share errors
    }
  };

  const handleDoubleClick = () => {
    if (!liked) {
      toggleLike();
    }
    setShowHeart(true);
    if (heartTimer.current) {
      clearTimeout(heartTimer.current);
    }
    heartTimer.current = setTimeout(() => setShowHeart(false), 700);
  };

  return (
    <article className="rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-4 pt-4">
        <Link href={postUrl} className="flex items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={username}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fh-green)] text-xs font-semibold text-white">
              {username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-sm font-semibold">{username}</div>
        </Link>
        <Link href={postUrl} className="text-sm text-zinc-400">
          ...
        </Link>
      </header>

      <div
        className="relative mt-3 aspect-[4/5] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900"
        onDoubleClick={handleDoubleClick}
      >
        {mediaSrc ? (
          mediaType === "VIDEO" ? (
            <video
              src={mediaSrc}
              className="h-full w-full object-cover"
              controls
            />
          ) : (
            <img
              src={mediaSrc}
              alt={caption || username}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
            Sem midia
          </div>
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center text-7xl transition ${
            showHeart ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          {"\u2764"}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-3 text-2xl">
          <button
            onClick={toggleLike}
            className={`transition ${
              liked ? "text-red-500" : "text-zinc-700"
            }`}
          >
            {"\u2665"}
          </button>
          <Link href={postUrl} className="text-zinc-700">
            {"\u{1F4AC}"}
          </Link>
          <button onClick={handleShare} className="text-zinc-700">
            {"\u2197"}
          </button>
        </div>
        <button
          onClick={toggleSave}
          className={saved ? "text-[var(--fh-green)]" : "text-zinc-700"}
        >
          {"\u{1F516}"}
        </button>
      </div>

      <div className="px-4 pt-2 text-sm font-semibold">{likes} gostos</div>
      <div className="px-4 pt-1 text-sm">
        <span className="font-semibold">{username}</span> {caption}
      </div>
      <Link href={postUrl} className="block px-4 pt-1 text-xs text-zinc-500">
        Ver todos os {commentsCount} comentarios
      </Link>

      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <Link href={postUrl} className="text-sm font-semibold text-[#0095f6]">
          Abrir comentarios
        </Link>
      </div>
    </article>
  );
}
