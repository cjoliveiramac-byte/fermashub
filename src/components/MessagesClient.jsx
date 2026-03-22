/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const quickReactions = ["👍", "❤️", "😂", "🔥", "👏"];

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status) => {
  if (!status) return "";
  const map = {
    SENT: "enviada",
    DELIVERED: "entregue",
    READ: "lida",
  };
  return map[status] || status.toLowerCase();
};

const getInitial = (value) => {
  const safe = (value || "").trim();
  return safe ? safe.slice(0, 1).toUpperCase() : "U";
};

export default function MessagesClient() {
  const { data } = useSession();
  const user = data?.user;
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [groupMode, setGroupMode] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const typingTimeout = useRef(null);
  const eventSourceRef = useRef(null);
  const oldestRef = useRef(null);
  const scrollRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((conv) => conv.id === activeId),
    [conversations, activeId]
  );

  const onlineSet = useMemo(
    () => new Set(onlineUsers),
    [onlineUsers]
  );

  const participantIds = useMemo(() => {
    const ids = activeConversation?.participants?.map((p) => p.id) || [];
    return new Set(ids);
  }, [activeConversation?.participants]);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/messages/conversations");
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data);
    setActiveId((prev) => prev || data[0]?.id || null);
  }, []);

  const loadUsers = useCallback(async (searchValue = "") => {
    setUsersLoading(true);
    try {
      const res = await fetch(
        `/api/users?search=${encodeURIComponent(searchValue)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const refreshPresence = useCallback(async () => {
    if (!user?.id) return;
    await fetch("/api/messages/presence", { method: "POST" }).catch(() => {});
    const res = await fetch("/api/messages/presence");
    if (!res.ok) return;
    const data = await res.json();
    setOnlineUsers(data?.online || []);
  }, [user?.id]);

  const loadMessages = useCallback(async (conversationId, { before, prepend } = {}) => {
    if (!conversationId) return;
    if (prepend) {
      setLoadingMore(true);
    } else {
      setLoadingMessages(true);
      setHasMore(true);
    }
    try {
      const params = new URLSearchParams();
      params.set("take", "60");
      if (before) params.set("before", before);

      const res = await fetch(
        `/api/messages/conversations/${conversationId}?${params.toString()}`
      );
      if (!res.ok) {
        if (!prepend) setMessages([]);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        if (!prepend) setMessages([]);
        return;
      }

      if (data.length === 0) {
        if (!prepend) setMessages([]);
        setHasMore(false);
        return;
      }

      const oldest = data[0];
      oldestRef.current = oldest?.createdAt || null;

      if (prepend) {
        setMessages((prev) => [...data, ...prev]);
      } else {
        setMessages(data);
      }
      setHasMore(data.length >= 60);

      await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: "POST",
      });
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const timer = setInterval(loadConversations, 15000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    loadUsers("");
  }, [loadUsers]);

  useEffect(() => {
    if (!user?.id) return;
    refreshPresence();
    const timer = setInterval(refreshPresence, 20000);
    return () => clearInterval(timer);
  }, [refreshPresence, user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(userSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, loadUsers]);

  useEffect(() => {
    if (!activeId) return;
    oldestRef.current = null;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (!activeId) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const source = new EventSource(
      `/api/messages/stream?conversationId=${activeId}`
    );
    eventSourceRef.current = source;

    source.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev,
        { ...payload, reactions: payload.reactions || [] },
      ]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeId
            ? { ...conv, lastMessage: payload, unreadCount: 0 }
            : conv
        )
      );
      fetch(`/api/messages/conversations/${activeId}/read`, {
        method: "POST",
      }).catch(() => {});
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const node = scrollRef.current;
          const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
          if (distance < 120) {
            node.scrollTop = node.scrollHeight;
          }
        }
      });
    });

    source.addEventListener("typing", (event) => {
      const payload = JSON.parse(event.data);
      if (payload?.userId === user?.id) return;
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      setTyping(payload?.typing);
      typingTimeout.current = setTimeout(() => setTyping(false), 1500);
    });

    return () => {
      source.close();
    };
  }, [activeId, user?.id]);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploading(false);
        return;
      }
      setAttachment({
        url: data.url,
        type: data.mediaType,
        name: data.mediaName || file.name,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAttach = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleSend = async () => {
    if (!activeId) return;
    if (editingId) {
      const text = draft.trim();
      if (!text) return;
      const res = await fetch(`/api/messages/${editingId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) =>
          prev.map((msg) => (msg.id === editingId ? { ...msg, ...updated } : msg))
        );
        setEditingId(null);
        setDraft("");
      }
      return;
    }

    if ((!draft.trim() && !attachment) || !activeId) return;
    const text = draft.trim();
    setDraft("");
    const res = await fetch(`/api/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: activeId,
        content: text,
        mediaUrl: attachment?.url,
        mediaType: attachment?.type,
        mediaName: attachment?.name,
      }),
    });
    if (!res.ok) {
      setDraft(text);
    }
    setAttachment(null);
  };

  const handleTyping = async (value) => {
    setDraft(value);
    if (!activeId) return;
    fetch("/api/messages/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, typing: true }),
    }).catch(() => {});
  };

  const startDirectConversation = async (targetId) => {
    if (!targetId) return;
    const res = await fetch("/api/messages/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    await loadConversations();
    setActiveId(data.conversationId);
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const createGroupConversation = async () => {
    if (selectedUsers.length === 0) return;
    const res = await fetch("/api/messages/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "GROUP",
        title: groupTitle || "Novo grupo",
        memberIds: selectedUsers,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setGroupMode(false);
    setGroupTitle("");
    setSelectedUsers([]);
    await loadConversations();
    setActiveId(data.conversationId);
  };

  const addMemberToGroup = async (targetId) => {
    if (!activeId || !targetId) return;
    await fetch(`/api/messages/conversations/${activeId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: targetId }),
    });
    await loadConversations();
  };

  const handleReaction = async (messageId, emoji) => {
    if (!messageId || !emoji) return;
    const res = await fetch(`/api/messages/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, reactions: data.reactions } : msg
      )
    );
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) return;
    const res = await fetch("/api/messages/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, ...updated } : msg))
    );
  };

  const loadOlderMessages = async () => {
    if (!activeId || !oldestRef.current || loadingMore || !hasMore) return;
    await loadMessages(activeId, { before: oldestRef.current, prepend: true });
  };

  const previewContent = (message) => {
    if (message?.deletedAt) return "Mensagem apagada";
    if (message?.content) return message.content;
    if (message?.mediaType === "IMAGE") return "📷 Foto";
    if (message?.mediaType === "VIDEO") return "🎥 Vídeo";
    if (message?.mediaType === "FILE") return "📎 Ficheiro";
    return "Sem mensagens";
  };

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_280px]">
      <section className="flex h-full flex-col rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Conversas</h2>
          <button
            onClick={() => {
              setGroupMode((prev) => !prev);
              setSelectedUsers([]);
            }}
            className="rounded-full bg-[var(--fh-green)] px-3 py-1 text-xs font-semibold text-white"
          >
            {groupMode ? "Cancelar" : "Novo grupo"}
          </button>
        </div>
        {groupMode ? (
          <div className="mt-3 rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800">
            <input
              value={groupTitle}
              onChange={(event) => setGroupTitle(event.target.value)}
              placeholder="Nome do grupo"
              className="mb-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
            <button
              onClick={createGroupConversation}
              className="w-full rounded-full bg-[var(--fh-green)] px-3 py-1.5 text-xs font-semibold text-white"
              disabled={selectedUsers.length === 0}
            >
              Criar grupo ({selectedUsers.length})
            </button>
          </div>
        ) : null}
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-2">
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800">
              Nenhuma conversa iniciada.
            </div>
          ) : (
            conversations.map((conversation) => {
              const other =
                conversation.type === "DIRECT"
                  ? conversation.participants?.find(
                      (participant) => participant.id !== user?.id
                    )
                  : null;
              const avatarLabel =
                other?.name || other?.username || conversation.title;
              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveId(conversation.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    conversation.id === activeId
                      ? "border-[var(--fh-green)] bg-[var(--fh-green)]/10"
                      : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--fh-green)]/10 text-xs font-semibold text-[var(--fh-green)]">
                      {getInitial(avatarLabel)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">
                          {conversation.title}
                        </div>
                        {conversation.unreadCount > 0 ? (
                          <span className="rounded-full bg-[var(--fh-green)] px-2 py-0.5 text-[10px] font-semibold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {previewContent(conversation.lastMessage)}
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {formatTime(conversation.lastMessage?.createdAt)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="mt-4 border-t border-zinc-200/70 pt-4 text-xs font-semibold text-zinc-500 dark:border-zinc-800/70">
          Utilizadores
        </div>
        <input
          value={userSearch}
          onChange={(event) => setUserSearch(event.target.value)}
          placeholder="Procurar utilizador"
          className="mt-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-2">
          {usersLoading ? (
            <div className="text-xs text-zinc-400">A carregar...</div>
          ) : (
            users
              .filter((item) => item.id !== user?.id)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    groupMode
                      ? toggleSelectUser(item.id)
                      : startDirectConversation(item.id)
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                    groupMode && selectedUsers.includes(item.id)
                      ? "border-[var(--fh-green)] bg-[var(--fh-green)]/10"
                      : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {item.name || item.username}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        onlineSet.has(item.id) ? "bg-emerald-400" : "bg-zinc-300"
                      }`}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    @{item.username || item.email?.split("@")[0]}
                  </div>
                </button>
              ))
          )}
        </div>
      </section>

      <section
        className="flex h-full flex-col rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800/70">
          <div className="text-sm font-semibold">
            {activeConversation?.title || "Seleciona uma conversa"}
          </div>
          {typing ? (
            <div className="text-[11px] text-zinc-400">A digitar...</div>
          ) : null}
        </div>
        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          ref={scrollRef}
        >
          {!activeId ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">
              Escolhe uma conversa ou inicia um novo chat na coluna esquerda.
            </div>
          ) : loadingMessages ? (
            <div className="text-xs text-zinc-400">A carregar mensagens...</div>
          ) : messages.length === 0 ? (
            <div className="text-xs text-zinc-400">
              Nenhuma mensagem nesta conversa.
            </div>
          ) : (
            <div className="space-y-4">
              {hasMore ? (
                <button
                  onClick={loadOlderMessages}
                  className="w-full rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 transition hover:border-[var(--fh-green)] dark:border-zinc-800"
                  disabled={loadingMore}
                >
                  {loadingMore ? "A carregar..." : "Carregar mensagens antigas"}
                </button>
              ) : null}
              {messages.map((message) => {
                const isOwn = message.senderId === user?.id;
                const reactions = message.reactions || [];
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isOwn ? (
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {getInitial(message.senderName)}
                      </div>
                    ) : null}
                    <div className="max-w-[72%]">
                      {!isOwn ? (
                        <div className="mb-1 text-[10px] font-semibold text-zinc-500">
                          {message.senderName}
                        </div>
                      ) : null}
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm ${
                          isOwn
                            ? "bg-[var(--fh-green)] text-white"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {message.deletedAt ? (
                          <div className="text-xs opacity-70">
                            Mensagem apagada.
                          </div>
                        ) : (
                          <>
                            {message.mediaUrl ? (
                              message.mediaType === "VIDEO" ? (
                                <video
                                  src={message.mediaUrl}
                                  className="mb-2 w-full rounded-xl"
                                  controls
                                />
                              ) : message.mediaType === "IMAGE" ? (
                                <img
                                  src={message.mediaUrl}
                                  alt="Anexo"
                                  className="mb-2 w-full rounded-xl object-cover"
                                />
                              ) : (
                                <a
                                  href={message.mediaUrl}
                                  className="mb-2 block rounded-xl border border-zinc-200/70 bg-white/10 px-3 py-2 text-xs underline"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  📎 {message.mediaName || "Ficheiro"}
                                </a>
                              )
                            ) : null}
                            {message.content ? <div>{message.content}</div> : null}
                            <div className="mt-1 text-[10px] opacity-70">
                              {formatTime(message.createdAt)}
                              {message.editedAt ? " • editada" : ""}
                              {isOwn ? ` • ${statusLabel(message.status)}` : ""}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                        {reactions.map((reaction) => {
                          const reacted = reaction.userIds?.includes(user?.id);
                          return (
                            <button
                              key={`${message.id}-${reaction.emoji}`}
                              onClick={() =>
                                handleReaction(message.id, reaction.emoji)
                              }
                              className={`rounded-full border px-2 py-0.5 ${
                                reacted
                                  ? "border-[var(--fh-green)] text-[var(--fh-green)]"
                                  : "border-zinc-200 text-zinc-500"
                              }`}
                            >
                              {reaction.emoji} {reaction.count}
                            </button>
                          );
                        })}
                        <div className="flex items-center gap-1">
                          {quickReactions.map((emoji) => (
                            <button
                              key={`${message.id}-${emoji}`}
                              onClick={() => handleReaction(message.id, emoji)}
                              className="rounded-full border border-transparent px-1 text-xs hover:border-zinc-200"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              const custom = prompt("Emoji");
                              if (custom) handleReaction(message.id, custom);
                            }}
                            className="rounded-full border border-transparent px-1 text-xs hover:border-zinc-200"
                          >
                            😊
                          </button>
                        </div>
                        {isOwn && !message.deletedAt ? (
                          <div className="ml-auto flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingId(message.id);
                                setDraft(message.content || "");
                              }}
                              className="text-[10px] text-zinc-500 hover:text-[var(--fh-green)]"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-[10px] text-red-400 hover:text-red-500"
                            >
                              Apagar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-zinc-200/70 p-4 dark:border-zinc-800/70">
          {editingId ? (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              A editar mensagem
              <button
                onClick={() => {
                  setEditingId(null);
                  setDraft("");
                }}
                className="text-[10px] font-semibold"
              >
                Cancelar
              </button>
            </div>
          ) : null}
          {uploading ? (
            <div className="mb-2 text-xs text-zinc-400">A enviar ficheiro...</div>
          ) : null}
          {attachment ? (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-zinc-200/70 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800">
              <span>
                {attachment.type}: {attachment.name || attachment.url}
              </span>
              <button onClick={() => setAttachment(null)}>remover</button>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <label
              className={`rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer ${
                !activeId ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Anexar
              <input
                type="file"
                accept="*/*"
                onChange={handleAttach}
                className="hidden"
                disabled={!activeId}
              />
            </label>
            <input
              className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
              placeholder={
                activeId
                  ? "Escreve uma mensagem..."
                  : "Seleciona uma conversa para enviar mensagens"
              }
              value={draft}
              onChange={(event) => handleTyping(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={!activeId}
            />
            <button
              onClick={handleSend}
              className="rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
              disabled={!activeId}
            >
              {editingId ? "Guardar" : "Enviar"}
            </button>
          </div>
        </div>
      </section>

      <section className="hidden h-full flex-col rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950 lg:flex">
        <div className="text-sm font-semibold">Informacoes</div>
        {activeConversation?.type === "GROUP" &&
        activeConversation?.currentMemberRole === "ADMIN" ? (
          <div className="mt-3">
            <div className="text-xs font-semibold text-zinc-500">
              Adicionar membro
            </div>
            <div className="mt-2 space-y-2">
              {users
                .filter(
                  (item) =>
                    item.id !== user?.id && !participantIds.has(item.id)
                )
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addMemberToGroup(item.id)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-left text-xs text-zinc-600 transition hover:border-[var(--fh-green)] dark:border-zinc-700 dark:text-zinc-200"
                  >
                    {item.name || item.username}
                  </button>
                ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
          {activeConversation?.participants?.length ? (
            activeConversation.participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[var(--fh-green)] text-white flex items-center justify-center text-xs font-semibold">
                  {(participant.username || participant.name || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">
                      {participant.name || participant.username}
                    </div>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        onlineSet.has(participant.id)
                          ? "bg-emerald-400"
                          : "bg-zinc-300"
                      }`}
                    />
                  </div>
                  <div className="text-xs text-zinc-400">
                    @{participant.username || participant.email?.split("@")[0]}
                  </div>
                  {participant.memberRole === "ADMIN" ? (
                    <div className="text-[10px] font-semibold text-[var(--fh-green)]">
                      Admin
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-zinc-400">
              Seleciona uma conversa para ver os participantes.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
