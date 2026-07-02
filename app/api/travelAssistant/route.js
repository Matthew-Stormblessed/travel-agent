import { Agent, run, tool } from "@openai/agents";
import { getJson } from "serpapi";
import { z } from "zod";

const getWeatherTool = tool({
  name: "get_weather",
  description: "Get the weather for a given latitude and longitude and how many forcast days.",
  parameters: z.object({
    latitude: z.string(),
    longitude: z.string(),
    forcastDays: z.string()
  }),
  async execute({ latitude, longitude, forcastDays }) {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&forcast_days=${forcastDays}`)

      const data = await response.json();

      return data;
    }
    catch (e) {
      console.log("Error while getting weather \n" + e)
    }
  },
});

const getHotelsTool = tool({
  name: "get_hotels",
  description: "Get the hotels for a given city, check in date, check out date, and number of adults.'",
  parameters: z.object({
    city: z.string(),
    check_in: z.string(),
    check_out: z.string(),
    num_adults: z.string()
  }),
  async execute({ city, check_in, check_out, num_adults }) {

    try {
      const response = await getJson({
        api_key: process.env.SERP_API_KEY,
        engine: "google_hotels",
        q: city,
        check_in_date: check_in,
        check_out_date: check_out,
        adults: num_adults,
        currency: "USD",
        gl: "us",
        hl: "en"
      });

      return response;
    }
    catch (e) {
      console.log(e)
    }
  },
});

const getFlightsTool = tool({
  name: "get_flights",
  description: "Get flights from one location to another at a specific time. Uses google api. departure_id is the id of the airport you start from. And arrival_id is the id of the airport you end in. An example call might look like getFlightsTool('SLC', 'CUN', '2026-07-02', '2026-07-05')",
  parameters: z.object({
    departure_id: z.string(),
    arrival_id: z.string(),
    trip_start: z.string(),
    trip_end: z.string()
  }),
  async execute({ departure_id, arrival_id, trip_start, trip_end }) {
    try {

      const flightResponse = await getJson({
        api_key: process.env.SERP_API_KEY,
        engine: "google_flights",
        hl: "en",
        gl: "us",
        departure_id: departure_id,
        arrival_id: arrival_id,
        outbound_date: trip_start,
        return_date: trip_end,
        currency: "USD"
      })

      return flightResponse
    }
    catch (e) {
      console.log("Error in getting flight \n" + e)
    }
  },
});

const agent = new Agent({
  name: "Travel Agent",
  instructions:
    "You are a travel agent who gives concise recomendations. Use get_weather_tool as needed to fetch the weather of a location. Use get_flights tool to get flights for the specific request. No specific airport will be submitted, use the most popular one in that location. Do not ask follow up questions. When returning your final response, it will be in VALID JSON. The json will contain a weatherSummery(A 1 sentence summery of what the weather will look like in the destination at the time. If the start date is within 14 days of the current date use the get_weather tool. Otherwise just make a guess. Prefer to use the get_weather_tool though.), a flightSummery(a 1 sentence summery of what the flight will look like), and a flightLink(a link to the preffered flight. This link must include the departure and arrival). A hotel summery (1 sentence summerizing the results of using the get_hotels tool). And a hotel link(a link to the best hotel) If you do not know, dont make it up.",
  model: "gpt-5.4-nano",
  tools: [getWeatherTool, getFlightsTool, getHotelsTool]
});

export async function POST(request) {
  try {
    const req = await request.json()

    const now = new Date();

    const result = await run(agent, `Suggest what you would think is the best roundtrip flight from ${req.flyingFrom} to ${req.flyingTo} from ${req.startDate} to ${req.endDate} for ${req.numPeople} people and this price ${req.budget}. Also suggest a hotel in the area. This is the current date ${now}`);

    return Response.json(result.finalOutput)
  }
  catch (e) {
    console.log(e);

    return Response.json(e)
  }
}