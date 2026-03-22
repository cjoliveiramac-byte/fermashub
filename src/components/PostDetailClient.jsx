/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function PostDetailClient({ post, initialComments }) {
  const { data } = useSession();
  const user = data?.user;
  const [liked, setLiked] = useState(Boolean(post?.liked));
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [comments, setComments] = useState(initialComments || []);
  const [commentDraft, setCommentDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleLike = async () => {
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setLiked(Boolean(data.liked));
    setLikesCount(data.likesCount || 0);
  };

  const addComment = async () => {
    if (!commentDraft.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentDraft }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...prev, { ...data, likesCount: 0, liked: false }]);
      setCommentDraft("");
    }
    setSubmitting(false);
  };

  const toggleCommentLike = async (commentId) => {
    const res = await fetch(`/api/comments/${commentId}/like`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = await res.json();
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              liked: Boolean(data.liked),
              likesCount: data.likesCount || 0,
            }
          : comment
      )
    );
  };

  return (
    <article className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
      <div className="text-xs text-zinc-500">
        {post.authorName} - {formatDate(post.createdAt)}
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{post.title || "Post"}</h1>
      {post.mediaUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70">
          {post.mediaType === "VIDEO" ? (
            <video src={post.mediaUrl} controls className="w-full" />
          ) : (
            <img src={post.mediaUrl} alt="Media" className="w-full object-cover" />
          )}
        </div>
      ) : null}
      <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
        {post.content}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={toggleLike}
          className={`text-sm font-semibold ${
            liked ? "text-red-500" : "text-zinc-500"
          }`}
        >
          {liked ? "â™¥" : "â™¡"} {likesCount} gostos
        </button>
        <div className="flex items-center gap-3">
          <Link
            href={`/perfil/${post.authorUsername}`}
            className="text-xs font-semibold text-zinc-500"
          >
            Ver perfil
          </Link>
          <button
            onClick={async () => {
              const reason = window.prompt("Por que queres denunciar este post?");
              if (!reason) return;
              await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "POST",
                  targetId: post.id,
                  reason,
                }),
              });
            }}
            className="text-xs font-semibold text-red-500"
          >
            Denunciar
          </button>
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-200/70 pt-4 dark:border-zinc-800/70">
        <div className="text-sm font-semibold">Comentários</div>
        <div className="mt-3 space-y-3">
          {comments.length === 0 ? (
            <div className="text-xs text-zinc-400">
              Ainda não há comentários.
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-zinc-200/70 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {comment.authorName}
                  </span>
                  <button
                    onClick={() => toggleCommentLike(comment.id)}
                    className={`text-xs font-semibold ${
                      comment.liked ? "text-red-500" : "text-zinc-400"
                    }`}
                  >
                    â™¥ {comment.likesCount || 0}
                  </button>
                </div>
                <p className="mt-2">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {user ? (
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Adicionar um comentário..."
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addComment();
                }
              }}
            />
            <button
              onClick={addComment}
              disabled={submitting}
              className="rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
            >
              Publicar
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

