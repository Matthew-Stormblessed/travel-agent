import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@openai/agents", () => ({
  Agent: class Agent {},
  run: vi.fn(),
  tool: vi.fn((definition) => definition),
}))

vi.mock("serpapi", () => ({
  getJson: vi.fn(),
}))

import { run } from "@openai/agents"
import { POST, tripRequestSchema } from "../app/api/travelAssistant/route"

const validTrip = {
  numTravelers: 2,
  flyingFrom: "SLC",
  flyingTo: "CUN",
  startDate: "2099-07-02",
  endDate: "2099-07-05",
  budget: 2500,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("tripRequestSchema", () => {
  it("accepts a valid trip request", () => {
    expect(tripRequestSchema.safeParse(validTrip).success).toBe(true)
  })

  it("rejects incomplete and incorrectly ordered trips", () => {
    const result = tripRequestSchema.safeParse({
      ...validTrip,
      flyingFrom: "",
      endDate: "2099-07-01",
    })

    expect(result.success).toBe(false)
    expect(result.error.flatten().fieldErrors.flyingFrom).toBeDefined()
    expect(result.error.flatten().fieldErrors.endDate).toBeDefined()
  })
})

describe("POST /api/travelAssistant", () => {
  it("returns 400 for invalid input without calling the agent", async () => {
    const response = await POST(new Request("http://localhost/api/travelAssistant", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    }))

    expect(response.status).toBe(400)
    expect(run).not.toHaveBeenCalled()
  })

  it("returns 503 when provider credentials are missing", async () => {
    const openAiKey = process.env.OPENAI_API_KEY
    const serpKey = process.env.SERP_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.SERP_API_KEY

    try {
      const response = await POST(new Request("http://localhost/api/travelAssistant", {
        method: "POST",
        body: JSON.stringify(validTrip),
        headers: { "Content-Type": "application/json" },
      }))

      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toEqual({ error: "Travel planning is temporarily unavailable" })
    } finally {
      process.env.OPENAI_API_KEY = openAiKey
      process.env.SERP_API_KEY = serpKey
    }
  })

  it("passes the validated traveler count to the agent and returns its result", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key"
    process.env.SERP_API_KEY = "test-serp-key"
    vi.mocked(run).mockResolvedValueOnce({ finalOutput: JSON.stringify({
      weatherSummery: "Sunny",
      flightSummery: "We recommend a morning flight",
      flightLink: "https://example.com/flight",
      hotelSummery: "We recommend a central hotel",
      hotelLink: "https://example.com/hotel",
    }) })

    const response = await POST(new Request("http://localhost/api/travelAssistant", {
      method: "POST",
      body: JSON.stringify(validTrip),
      headers: { "Content-Type": "application/json" },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      weatherSummery: "Sunny",
      flightSummery: "We recommend a morning flight",
      flightLink: "https://example.com/flight",
      hotelSummery: "We recommend a central hotel",
      hotelLink: "https://example.com/hotel",
    })
    expect(vi.mocked(run).mock.calls[0][1]).toContain('"numTravelers":2')
  })

  it("rejects unsafe recommendation links from the agent", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key"
    process.env.SERP_API_KEY = "test-serp-key"
    vi.mocked(run).mockResolvedValueOnce({ finalOutput: JSON.stringify({
      weatherSummery: "Sunny",
      flightSummery: "We recommend a morning flight",
      flightLink: "javascript:alert(1)",
      hotelSummery: "We recommend a central hotel",
      hotelLink: "https://example.com/hotel",
    }) })

    const response = await POST(new Request("http://localhost/api/travelAssistant", {
      method: "POST",
      body: JSON.stringify(validTrip),
      headers: { "Content-Type": "application/json" },
    }))

    expect(response.status).toBe(502)
  })
})
