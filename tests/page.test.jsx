import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import Home from "../app/page"

vi.mock("next/image", () => ({
  default: (props) => <img {...props} />,
}))

describe("travel planning form", () => {
  it("submits a trip and displays the recommendations", async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => JSON.stringify({
        weatherSummery: "Sunny and warm",
        flightSummery: "We recommend the morning flight",
        flightLink: "https://example.com/flight",
        hotelSummery: "We recommend a central hotel",
        hotelLink: "https://example.com/hotel",
      }),
    })

    render(<Home />)
    await user.click(screen.getByRole("button", { name: /let's begin/i }))
    await user.type(screen.getByLabelText("Flying from"), "SLC")
    await user.type(screen.getByLabelText("Flying to"), "CUN")
    await user.type(screen.getByLabelText("Departure date"), "2099-07-02")
    await user.type(screen.getByLabelText("Return date"), "2099-07-05")
    await user.clear(screen.getByLabelText("Budget (USD)"))
    await user.type(screen.getByLabelText("Budget (USD)"), "2500")
    await user.click(screen.getByRole("button", { name: /plan my trip/i }))

    await waitFor(() => expect(screen.getByRole("heading", { name: "Your trip" })).toBeInTheDocument())
    expect(screen.getByText("Sunny and warm")).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith("/api/travelAssistant", expect.objectContaining({ method: "POST" }))
  })
})
