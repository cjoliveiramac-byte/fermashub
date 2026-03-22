/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

const quickReactions = ["👍", "❤️", "😂", "🔥", "👏"];

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function GroupClient() {
  const params = useParams();
  const groupId = params?.id;
  const [group, setGroup] = useState(null);
  const [membership, setMembership] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: "", type: "TEXT" });
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const oldestRef = useRef(null);

  const isAdmin = ["OWNER", "ADMIN"].includes(membership?.role || "");
  const isMuted =
    membership?.status === "MUTED" &&
    membership?.mutedUntil &&
    new Date(membership.mutedUntil) > new Date();

  const activeChannel = channels.find((channel) => channel.id === activeChannelId);
  const pinnedMessages = useMemo(
    () => messages.filter((msg) => msg.pinnedAt).slice(0, 3),
    [messages]
  );

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGroup(data.group);
      setChannels(data.channels || []);
      setMembers(data.members || []);
      setMembership(data.membership);
      setActiveChannelId((prev) => prev || data.channels?.[0]?.id || null);
    } catch {
      toast.error("Falha ao carregar grupo.");
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const loadMessages = useCallback(
    async (channelId, { before, prepend, refresh } = {}) => {
    if (!channelId) return;
    if (prepend) {
      setLoadingMore(true);
    } else if (!refresh) {
      setLoadingMessages(true);
    }
    try {
      const params = new URLSearchParams();
      params.set("take", "60");
      if (before) params.set("before", before);
      const res = await fetch(
        `/api/groups/${groupId}/channels/${channelId}/messages?${params.toString()}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!Array.isArray(data)) return;

      if (data.length === 0 && !prepend) {
        setMessages([]);
        setHasMore(false);
        return;
      }

      const oldest = data[0];
      oldestRef.current = oldest?.createdAt || oldestRef.current;
      if (prepend) {
        setMessages((prev) => [...data, ...prev]);
      } else {
        setMessages(data);
      }
      setHasMore(data.length >= 60);
    } catch {
      if (!refresh) toast.error("Falha ao carregar mensagens.");
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
    },
    [groupId]
  );

  useEffect(() => {
    if (!activeChannelId) return;
    oldestRef.current = null;
    loadMessages(activeChannelId);
  }, [activeChannelId, loadMessages]);

  useEffect(() => {
    if (!activeChannelId) return;
    const timer = setInterval(() => {
      loadMessages(activeChannelId, { refresh: true });
    }, 10000);
    return () => clearInterval(timer);
  }, [activeChannelId, loadMessages]);

  const loadUsers = useCallback(async (searchValue = "") => {
    try {
      const res = await fetch(
        `/api/users?search=${encodeURIComponent(searchValue)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setUserOptions(data);
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch.trim()) {
        loadUsers(userSearch);
      } else {
        setUserOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, loadUsers]);

  const handleJoin = async () => {
    const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error || "Falha ao entrar.");
      return;
    }
    toast.success("Bem-vindo ao grupo.");
    loadGroup();
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim()) {
      toast.error("Nome do canal obrigatorio.");
      return;
    }
    const res = await fetch(`/api/groups/${groupId}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newChannel),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error || "Falha ao criar canal.");
      return;
    }
    const channel = await res.json();
    setChannels((prev) => [...prev, channel]);
    setActiveChannelId(channel.id);
    setNewChannel({ name: "", type: "TEXT" });
  };

  const handleDeleteChannel = async (channelId) => {
    const ok = confirm("Apagar este canal?");
    if (!ok) return;
    const res = await fetch(
      `/api/groups/${groupId}/channels/${channelId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      toast.error("Falha ao apagar canal.");
      return;
    }
    setChannels((prev) => prev.filter((channel) => channel.id !== channelId));
    if (activeChannelId === channelId && channels.length > 0) {
      setActiveChannelId(channels[0]?.id || null);
    }
  };

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
    if (!activeChannelId) return;
    if (!draft.trim() && !attachment) return;
    const res = await fetch(
      `/api/groups/${groupId}/channels/${activeChannelId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: draft.trim(),
          mediaUrl: attachment?.url,
          mediaType: attachment?.type,
          mediaName: attachment?.name,
        }),
      }
    );
    if (!res.ok) {
      const data = await res.json();
      toast.error(data?.error || "Falha ao enviar.");
      return;
    }
    setDraft("");
    setAttachment(null);
    loadMessages(activeChannelId, { refresh: true });
  };

  const handleReaction = async (messageId, emoji) => {
    const res = await fetch(
      `/api/groups/${groupId}/channels/${activeChannelId}/messages/${messageId}/reactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      }
    );
    if (!res.ok) return;
    const data = await res.json();
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, reactions: data.reactions } : msg
      )
    );
  };

  const handlePin = async (messageId, pinned) => {
    const res = await fetch(
      `/api/groups/${groupId}/channels/${activeChannelId}/messages/${messageId}/pin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      }
    );
    if (!res.ok) return;
    loadMessages(activeChannelId, { refresh: true });
  };

  const handleLoadOlder = async () => {
    if (!oldestRef.current || loadingMore || !hasMore) return;
    await loadMessages(activeChannelId, { before: oldestRef.current, prepend: true });
  };

  const handleAddMember = async (userId) => {
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error || "Falha ao adicionar.");
      return;
    }
    toast.success("Membro adicionado.");
    setUserSearch("");
    setUserOptions([]);
    loadGroup();
  };

  const handleMemberUpdate = async (memberId, payload) => {
    const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error || "Falha ao atualizar.");
      return;
    }
    loadGroup();
  };

  const handleMemberRemove = async (memberId) => {
    const ok = confirm("Remover membro?");
    if (!ok) return;
    const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Falha ao remover.");
      return;
    }
    loadGroup();
  };

  if (!group) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        A carregar grupo...
      </div>
    );
  }

  if (membership?.status === "BANNED") {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        O acesso a este grupo foi bloqueado.
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {group.description || "Sem descrição."}
          </p>
          <button
            onClick={handleJoin}
            className="mt-4 rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
          >
            Entrar no grupo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_260px]">
      <section className="flex h-full flex-col rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950">
        <div className="rounded-xl overflow-hidden border border-zinc-200/70 dark:border-zinc-800">
          <img
            src={group.bannerUrl || "/fermas-bg.png"}
            alt={group.name}
            className="h-24 w-full object-cover"
          />
        </div>
        <div className="mt-3">
          <div className="text-sm font-semibold">{group.name}</div>
          <p className="mt-1 text-xs text-zinc-500">
            {group.description || "Sem descrição."}
          </p>
        </div>
        <div className="mt-4 text-xs font-semibold text-zinc-500">
          Canais
        </div>
        <div className="mt-2 space-y-1">
          {channels.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800">
              {isAdmin
                ? "Sem canais. Crie o primeiro canal abaixo."
                : "Sem canais disponiveis neste grupo."}
            </div>
          ) : (
            channels.map((channel) => (
              <div key={channel.id} className="flex items-center gap-2">
                <button
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-left text-xs transition ${
                    channel.id === activeChannelId
                      ? "bg-[var(--fh-green)]/10 text-[var(--fh-green)]"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  #{channel.name}
                  <span className="ml-2 text-[10px] text-zinc-400">
                    {channel.type.toLowerCase()}
                  </span>
                </button>
                {isAdmin ? (
                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
                    className="text-[10px] text-red-400"
                  >
                    apagar
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
        {isAdmin ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800">
            <div className="font-semibold">Criar canal</div>
            <input
              value={newChannel.name}
              onChange={(event) =>
                setNewChannel((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Nome do canal"
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
            <select
              value={newChannel.type}
              onChange={(event) =>
                setNewChannel((prev) => ({ ...prev, type: event.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="TEXT">Texto</option>
              <option value="MEDIA">Mídia</option>
              <option value="ANNOUNCEMENT">Anúncios</option>
            </select>
            <button
              onClick={handleCreateChannel}
              className="mt-2 w-full rounded-full bg-[var(--fh-green)] px-3 py-2 text-xs font-semibold text-white"
            >
              Criar canal
            </button>
          </div>
        ) : null}
      </section>

      <section
        className="flex h-full flex-col rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800/70">
          <div className="text-sm font-semibold">
            #{activeChannel?.name || "Seleciona um canal"}
          </div>
          <div className="text-xs text-zinc-400">
            {activeChannel?.type?.toLowerCase() || "canal"}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {pinnedMessages.length > 0 ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              <div className="font-semibold">Mensagens fixadas</div>
              <div className="mt-2 space-y-1">
                {pinnedMessages.map((msg) => (
                  <div key={msg.id}>
                    {msg.senderName}: {msg.content.slice(0, 80)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {!activeChannelId ? (
            <div className="text-xs text-zinc-400">
              Selecione um canal para ver as mensagens.
            </div>
          ) : loadingMessages ? (
            <div className="text-xs text-zinc-400">A carregar mensagens...</div>
          ) : messages.length === 0 ? (
            <div className="text-xs text-zinc-400">
              Nenhuma mensagem neste canal.
            </div>
          ) : (
            <div className="space-y-4">
              {hasMore ? (
                <button
                  onClick={handleLoadOlder}
                  className="w-full rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 transition hover:border-[var(--fh-green)] dark:border-zinc-800"
                  disabled={loadingMore}
                >
                  {loadingMore ? "A carregar..." : "Carregar mensagens antigas"}
                </button>
              ) : null}
              {messages.map((message) => (
                <div key={message.id} className="flex gap-2">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {message.senderName?.slice(0, 1)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-zinc-600">
                      {message.senderName}
                    </div>
                    <div className="mt-1 rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
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
                      {message.content}
                      <div className="mt-1 text-[10px] text-zinc-400">
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                      {(message.reactions || []).map((reaction) => (
                        <button
                          key={`${message.id}-${reaction.emoji}`}
                          onClick={() => handleReaction(message.id, reaction.emoji)}
                          className="rounded-full border border-zinc-200 px-2 py-0.5"
                        >
                          {reaction.emoji} {reaction.count}
                        </button>
                      ))}
                      {quickReactions.map((emoji) => (
                        <button
                          key={`${message.id}-${emoji}`}
                          onClick={() => handleReaction(message.id, emoji)}
                          className="rounded-full border border-transparent px-1 text-xs hover:border-zinc-200"
                        >
                          {emoji}
                        </button>
                      ))}
                      {isAdmin ? (
                        <button
                          onClick={() =>
                            handlePin(message.id, !message.pinnedAt)
                          }
                          className="ml-auto text-[10px] text-amber-600"
                        >
                          {message.pinnedAt ? "Desafixar" : "Fixar"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-zinc-200/70 p-4 dark:border-zinc-800/70">
          {isMuted ? (
            <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Estás silenciado até {new Date(membership.mutedUntil).toISOString().slice(0, 10)}.
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
                !activeChannelId || isMuted ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Anexar
              <input
                type="file"
                accept="*/*"
                onChange={handleAttach}
                className="hidden"
                disabled={!activeChannelId || isMuted}
              />
            </label>
            <input
              className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-[var(--fh-green)] dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Escreve uma mensagem..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={!activeChannelId || isMuted}
            />
            <button
              onClick={handleSend}
              className="rounded-full bg-[var(--fh-green)] px-4 py-2 text-xs font-semibold text-white"
              disabled={!activeChannelId || isMuted}
            >
              Enviar
            </button>
          </div>
        </div>
      </section>

      <section className="hidden h-full flex-col rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950 lg:flex">
        <div className="text-sm font-semibold">Membros</div>
        <div className="mt-3 space-y-3 text-xs text-zinc-500">
          {members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800">
              Nenhum membro encontrado.
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-zinc-200/70 p-3 dark:border-zinc-800"
              >
                <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {member.profile?.name || member.profile?.username || "Utilizador"}
                </div>
                <div className="mt-1 text-[10px] uppercase text-zinc-400">
                  {member.role}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {isAdmin && member.role === "MEMBER" ? (
                    <button
                      onClick={() =>
                        handleMemberUpdate(member.id, { role: "MODERATOR" })
                      }
                      className="rounded-full border border-zinc-200 px-2 py-1 text-[10px]"
                    >
                      Tornar moderador
                    </button>
                  ) : null}
                  {isAdmin && member.role === "MODERATOR" ? (
                    <button
                      onClick={() =>
                        handleMemberUpdate(member.id, { role: "MEMBER" })
                      }
                      className="rounded-full border border-zinc-200 px-2 py-1 text-[10px]"
                    >
                      Remover moderador
                    </button>
                  ) : null}
                  {isAdmin ? (
                    <button
                      onClick={() =>
                        handleMemberUpdate(member.id, {
                          status: "MUTED",
                          mutedUntil: new Date(Date.now() + 3600 * 1000).toISOString(),
                        })
                      }
                      className="rounded-full border border-amber-300 px-2 py-1 text-[10px] text-amber-600"
                    >
                      Silenciar
                    </button>
                  ) : null}
                  {isAdmin ? (
                    <button
                      onClick={() => handleMemberUpdate(member.id, { status: "BANNED" })}
                      className="rounded-full border border-red-300 px-2 py-1 text-[10px] text-red-500"
                    >
                      Banir
                    </button>
                  ) : null}
                  {isAdmin ? (
                    <button
                      onClick={() => handleMemberRemove(member.id)}
                      className="rounded-full border border-zinc-200 px-2 py-1 text-[10px]"
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
        {isAdmin ? (
          <div className="mt-4">
            <div className="text-xs font-semibold text-zinc-500">
              Adicionar membro
            </div>
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Pesquisar utilizador"
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
            <div className="mt-2 space-y-2">
              {userSearch.trim() &&
              userOptions.filter(
                (option) => !members.some((member) => member.userId === option.id)
              ).length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-[10px] text-zinc-500 dark:border-zinc-800">
                  Sem resultados para a pesquisa.
                </div>
              ) : (
                userOptions
                  .filter(
                    (option) =>
                      !members.some((member) => member.userId === option.id)
                  )
                  .map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAddMember(option.id)}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-left text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-200"
                    >
                      {option.name || option.username}
                    </button>
                  ))
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
