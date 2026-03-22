const globalForRateLimit = globalThis;

const buckets =
  globalForRateLimit.rateLimitBuckets || new Map();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitBuckets = buckets;
}

export const rateLimit = (key, limit, windowMs) => {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.reset) {
    const next = { count: 1, reset: now + windowMs };
    buckets.set(key, next);
    return { allowed: true, remaining: limit - 1, reset: next.reset };
  }

  entry.count += 1;
  buckets.set(key, entry);

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, reset: entry.reset };
  }

  return { allowed: true, remaining: limit - entry.count, reset: entry.reset };
};
