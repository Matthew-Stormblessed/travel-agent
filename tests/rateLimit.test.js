import { describe, expect, it } from "vitest"
import { createRateLimiter, getClientKey } from "../app/api/travelAssistant/rateLimit"

describe("rate limiter", () => {
  it("allows the configured number of requests and blocks the next one", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 })

    expect(limiter.check("client-a", 1).allowed).toBe(true)
    expect(limiter.check("client-a", 2).allowed).toBe(true)
    expect(limiter.check("client-a", 3)).toMatchObject({ allowed: false, remaining: 0, limit: 2 })
  })

  it("starts a new window after the current one expires", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 })

    expect(limiter.check("client-a", 1).allowed).toBe(true)
    expect(limiter.check("client-a", 60_001).allowed).toBe(true)
  })

  it("prefers the first proxy address when deriving the client key", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1", "x-real-ip": "10.0.0.2" },
    })

    expect(getClientKey(request)).toBe("203.0.113.5")
  })
})
