'use client'

import Image from "next/image"
import { useState } from "react"
import Cat from "@/public/cat.png"
import Plane from "@/public/plane.png"

const fieldClassName = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
const buttonClassName = "rounded-xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"

function safeExternalUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : ""
  } catch {
    return ""
  }
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby={`${title.toLowerCase()}-heading`}>
      <h2 id={`${title.toLowerCase()}-heading`} className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-3 text-slate-700">{children}</div>
    </section>
  )
}

export default function Home() {
  const [startScreen, setStartScreen] = useState(true)
  const [numTravelers, setNumTravelers] = useState(1)
  const [tripPlanned, setTripPlanned] = useState(false)
  const [flyingFrom, setFlyingFrom] = useState("")
  const [flyingTo, setFlyingTo] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budget, setBudget] = useState(0)
  const [weatherSummery, setWeatherSummery] = useState("")
  const [flightSummery, setFlightSummery] = useState("")
  const [flightLink, setFlightLink] = useState("")
  const [hotelSummery, setHotelSummery] = useState("")
  const [hotelLink, setHotelLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const formattedDate = new Date().toISOString().split("T")[0]

  async function getTrip(event) {
    event.preventDefault()

    if (loading) return

    const normalizedBudget = Number(budget)
    if (!flyingFrom.trim() || !flyingTo.trim() || !startDate || !endDate) {
      setErrorMessage("Please complete every field before planning your trip.")
      return
    }
    if (startDate < formattedDate) {
      setErrorMessage("Your departure date cannot be in the past.")
      return
    }
    if (endDate < startDate) {
      setErrorMessage("Your return date must be on or after your departure date.")
      return
    }
    if (!Number.isFinite(normalizedBudget) || normalizedBudget < 0) {
      setErrorMessage("Please enter a valid budget.")
      return
    }

    setErrorMessage("")
    setLoading(true)

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""
      const response = await fetch(`${apiBaseUrl}/api/travelAssistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numTravelers,
          flyingFrom: flyingFrom.trim(),
          flyingTo: flyingTo.trim(),
          startDate,
          endDate,
          budget: normalizedBudget,
        }),
      })
      const data = await response.json()

      if (!response.ok || data?.error) {
        throw new Error(data?.error || "Unable to plan this trip right now.")
      }

      const result = typeof data === "string" ? JSON.parse(data) : data
      setWeatherSummery(result.weatherSummery || "No weather summary was provided.")
      setFlightSummery(result.flightSummery || "No flight summary was provided.")
      setFlightLink(safeExternalUrl(result.flightLink))
      setHotelSummery(result.hotelSummery || "No hotel summary was provided.")
      setHotelLink(safeExternalUrl(result.hotelLink))
      setTripPlanned(true)
    } catch (error) {
      console.error("Trip planning failed", error)
      setErrorMessage(error instanceof Error ? error.message : "Unable to plan this trip right now.")
    } finally {
      setLoading(false)
    }
  }

  function resetTrip() {
    setTripPlanned(false)
    setErrorMessage("")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        {startScreen && (
          <section className="flex w-full max-w-md flex-col items-center rounded-3xl bg-white p-6 text-center shadow-lg sm:p-10" aria-labelledby="welcome-heading">
            <Image src={Cat} width={380} height={50} alt="Illustration of a traveling cat" className="h-auto w-full max-w-sm" priority />
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Travel Agent</p>
            <h1 id="welcome-heading" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Plan a better trip</h1>
            <p className="mt-3 text-slate-600">Tell us where you are going and we&apos;ll find a flight, hotel, and weather overview.</p>
            <button type="button" onClick={() => setStartScreen(false)} className={`${buttonClassName} mt-8 w-full text-lg`}>Let&apos;s begin</button>
          </section>
        )}

        {!startScreen && !tripPlanned && (
          <section className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-lg sm:p-10" aria-labelledby="form-heading">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Your itinerary</p>
              <h1 id="form-heading" className="mt-2 text-3xl font-black tracking-tight">Where should we take you?</h1>
              <p className="mt-2 text-slate-600">A few details are all we need to get started.</p>
            </div>

            <form onSubmit={getTrip} className="mt-8 space-y-5">
              <div>
                <label htmlFor="travelers" className="font-semibold">Number of travelers</label>
                <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-300 px-3 py-2">
                  <button type="button" aria-label="Decrease number of travelers" onClick={() => setNumTravelers((value) => Math.max(1, value - 1))} className="h-10 w-10 rounded-full bg-slate-900 text-2xl leading-none text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200">−</button>
                  <span id="travelers" className="text-xl font-bold" aria-live="polite">{numTravelers}</span>
                  <button type="button" aria-label="Increase number of travelers" onClick={() => setNumTravelers((value) => Math.min(20, value + 1))} className="h-10 w-10 rounded-full bg-slate-900 text-2xl leading-none text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200">+</button>
                </div>
              </div>

              <div>
                <label htmlFor="flying-from" className="font-semibold">Flying from</label>
                <input id="flying-from" value={flyingFrom} onChange={(event) => setFlyingFrom(event.target.value)} className={fieldClassName} placeholder="City or airport code" autoComplete="address-level2" />
              </div>

              <div>
                <label htmlFor="flying-to" className="font-semibold">Flying to</label>
                <input id="flying-to" value={flyingTo} onChange={(event) => setFlyingTo(event.target.value)} className={fieldClassName} placeholder="City or airport code" autoComplete="address-level2" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="start-date" className="font-semibold">Departure date</label>
                  <input id="start-date" type="date" min={formattedDate} value={startDate} onChange={(event) => setStartDate(event.target.value)} className={fieldClassName} />
                </div>
                <div>
                  <label htmlFor="end-date" className="font-semibold">Return date</label>
                  <input id="end-date" type="date" min={startDate || formattedDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={fieldClassName} />
                </div>
              </div>

              <div>
                <label htmlFor="budget" className="font-semibold">Budget (USD)</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-3 text-slate-500">$</span>
                  <input id="budget" type="number" min="0" step="1" value={budget} onChange={(event) => setBudget(event.target.value)} className={`${fieldClassName} pl-8`} />
                </div>
              </div>

              {errorMessage && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-700">{errorMessage}</p>}

              <button type="submit" disabled={loading} className={`${buttonClassName} flex w-full items-center justify-center gap-3 text-lg`}>
                <Image src={Plane} width={60} height={30} alt="" className={loading ? "animate-bounce" : ""} />
                {loading ? "Planning your trip…" : "Plan my trip"}
              </button>
              <p className="text-center text-sm text-slate-500" aria-live="polite">{loading ? "Searching for recommendations. This can take a moment." : ""}</p>
            </form>
          </section>
        )}

        {!startScreen && tripPlanned && (
          <section className="w-full" aria-labelledby="trip-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Your itinerary</p>
                <h1 id="trip-heading" className="mt-2 text-4xl font-black tracking-tight">Your trip</h1>
                <p className="mt-2 text-lg text-slate-600">{flyingFrom} <span aria-hidden="true">→</span> {flyingTo}</p>
              </div>
              <button type="button" onClick={resetTrip} className="self-start rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 sm:self-auto">Edit trip</button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-sm text-slate-300">Departure</p><p className="mt-1 text-xl font-bold">{startDate}</p></div>
              <div className="rounded-2xl bg-emerald-100 p-5 text-slate-900"><p className="text-sm text-emerald-800">Return</p><p className="mt-1 text-xl font-bold">{endDate}</p></div>
            </div>

            <div className="mt-6 grid gap-5">
              <SectionCard title="Weather"><p>{weatherSummery}</p></SectionCard>
              <SectionCard title="Flights"><p>{flightSummery}</p>{flightLink && <a href={flightLink} target="_blank" rel="noopener noreferrer" className={`${buttonClassName} mt-5 inline-flex w-full justify-center sm:w-auto`}>View flight options <span aria-hidden="true">↗</span></a>}</SectionCard>
              <SectionCard title="Hotel"><p>{hotelSummery}</p>{hotelLink && <a href={hotelLink} target="_blank" rel="noopener noreferrer" className={`${buttonClassName} mt-5 inline-flex w-full justify-center sm:w-auto`}>View hotel options <span aria-hidden="true">↗</span></a>}</SectionCard>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
