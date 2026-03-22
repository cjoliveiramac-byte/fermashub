const globalForPresence = globalThis;

const defaultState = {
  users: new Map(),
};

export const presenceStore = globalForPresence.presenceStore || defaultState;

if (process.env.NODE_ENV !== "production") {
  globalForPresence.presenceStore = presenceStore;
}

export const setPresence = (userId) => {
  if (!userId) return;
  presenceStore.users.set(userId, Date.now());
};

export const getOnlineUsers = ({ withinMs = 120000, userIds = [] } = {}) => {
  const cutoff = Date.now() - withinMs;
  const online = new Set();

  const filter = userIds.length ? new Set(userIds) : null;

  presenceStore.users.forEach((lastSeen, userId) => {
    if (lastSeen >= cutoff && (!filter || filter.has(userId))) {
      online.add(userId);
    }
  });

  return Array.from(online);
};
