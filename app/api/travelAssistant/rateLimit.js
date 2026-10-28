export function createRateLimiter({ limit, windowMs, maxEntries = 10_000 }) {
  const clients = new Map()

  function removeExpired(now) {
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) {
        clients.delete(key)
      }
    }
  }

  return {
    check(key, now = Date.now()) {
      removeExpired(now)

      let entry = clients.get(key)
      if (!entry || entry.resetAt <= now) {
        if (!entry && clients.size >= maxEntries) {
          clients.delete(clients.keys().next().value)
        }

        entry = { count: 0, resetAt: now + windowMs }
        clients.set(key, entry)
      }

      entry.count += 1
      const allowed = entry.count <= limit

      return {
        allowed,
        limit,
        remaining: Math.max(0, limit - entry.count),
        resetAt: entry.resetAt,
      }
    },

    reset() {
      clients.clear()
    },
  }
}

export function getClientKey(request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown"

  return clientIp.slice(0, 100)
}
