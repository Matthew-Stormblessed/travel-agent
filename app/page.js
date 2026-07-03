
'use client'
import Image from "next/image";
import Cat from "@/public/cat.png"
import Plane from "@/public/plane.png"
import { useState } from "react"
import Swal from 'sweetalert2'

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
  const currentDate = new Date().toLocaleDateString()
  const regex = /(\d*)\/(\d*)\/(\d*)/
  const dateParts = currentDate.match(regex)
  const formattedDate = dateParts[3] + "-0" + dateParts[1] + "-0" + dateParts[2]
  console.log(formattedDate)


  async function GetTrip() {
    try {
      if (flyingFrom === "" || flyingTo === "" || startDate === "" || endDate === "") {
        Swal.fire({
          title: 'Error!',
          text: 'Hey!\nWe need to know all this info! Make sure every field is filled out.',
          icon: 'error',
          confirmButtonText: 'Cool'
        })
        return;
      }
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/travelAssistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          numTravelers: numTravelers,
          flyingFrom: flyingFrom,
          flyingTo: flyingTo,
          startDate: startDate,
          endDate: endDate,
          budget: budget
        })
      })
      const data = await response.json();

      const dataJSON = JSON.parse(data);

      setWeatherSummery(dataJSON.weatherSummery)
      setFlightSummery(dataJSON.flightSummery)
      setFlightLink(dataJSON.flightLink)
      setHotelSummery(dataJSON.hotelSummery)
      setHotelLink(dataJSON.hotelLink)


      setTripPlanned(true)
      setLoading(false)
    }
    catch (e) {
      console.log("Error: \n" + e)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen overflow-auto">
      {startScreen &&
        <>
          <Image src={Cat} height={50} width={380} alt="cat" />
          <button onClick={() => setStartScreen(false)} className="min-w-[324px] min-h-[60px] rounded-2xl border-4 text-[25px] font-bold bg-[#4BDCB0]">Let's Begin</button>
        </>
      }
      {!startScreen && !tripPlanned &&
        <>
          <h2 className="text-2xl font-bold mt-2">Number of travelers</h2>
          <div className="w-[324px] border-4 rounded-4xl flex flex-row justify-between p-2 text-[25px] font-bold">
            <button onClick={() => numTravelers > 1 ? setNumTravelers(prev => prev - 1) : ""} className="bg-black text-white w-[38px] h-[38px] text-[35px] font-bold rounded-full flex items-center justify-center">-</button>
            {numTravelers}
            <button onClick={() => setNumTravelers(prev => prev + 1)} className="bg-black text-white w-[38px] h-[38px] rounded-full text-[35px] font-bold flex items-center justify-center">+</button>
          </div>
          <h2 className="text-2xl font-bold mt-[49px]">Flying from</h2>
          <div className="w-[324px] border-4 rounded-4xl flex flex-row justify-between p-2 text-[25px] font-bold">
            <input onChange={e => setFlyingFrom(e.target.value)} value={flyingFrom} className="text-center w-full" />
          </div>
          <h2 className="text-2xl font-bold mt-2">Flying to</h2>
          <div className="w-[324px] border-4 rounded-4xl flex flex-row justify-between p-2 text-[25px] font-bold">
            <input value={flyingTo} onChange={e => setFlyingTo(e.target.value)} className="text-center w-full" />
          </div>
          <h2 className="text-2xl font-bold mt-[49px]">From date</h2>
          <div className="w-[324px] border-4 rounded-4xl flex flex-row justify-between p-2 text-[25px] font-bold">
            <input type="date" min={formattedDate} onChange={e => setStartDate(e.target.value)} value={startDate} className="text-center w-full" />
          </div>
          <h2 className="text-2xl font-bold mt-2">To date</h2>
          <div className="w-[324px] border-4 rounded-4xl flex flex-row justify-between p-2 text-[25px] font-bold">
            <input onChange={e => setEndDate(e.target.value)} value={endDate} type="date" min={startDate !== "" ? startDate : formattedDate} className="text-center w-full" />
          </div>
          <h2 className="text-2xl font-bold mt-[38px]">Budget</h2>
          <div className="w-[324px] border-4 rounded-4xl flex flex-row justify-between p-2 text-[25px] font-bold">
            $
            <input value={budget} onChange={e => setBudget(e.target.value)} type="number" className="text-center w-full" />
          </div>
          <div className="flex flex-row mr-23">
          <Image className={`mr-2 ${loading ? 'animate-bounce' : ''}`} src={Plane} height={50} width={100} alt="cat" />
          <button onClick={GetTrip} className="w-[324px] border-4 rounded-4xl flex-row p-2 text-[25px] font-bold flex items-center justify-center mt-[17px] bg-[#4BDCB0]">
            Plan my trip!
          </button>
          </div>
        </>
      }

      {!startScreen && tripPlanned &&

        <>
          <h1 className="text-5xl font-bold mt-20">Your Trip</h1>
          <div className="flex flex-row gap-5 mt-[34px]">
            <div className="bg-[#BBF7F7] min-h-[40px] min-w-[169px] rounded-3xl flex justify-center font-bold text-[20px] items-center">→ {startDate}</div>
            <div className="bg-[#BBF7F7] min-h-[40px] min-w-[169px] rounded-3xl flex justify-center font-bold text-[20px] items-center">{endDate} ←</div>
          </div>
          <div className="bg-[#BBF7F7] min-h-[61px] min-w-[351px] mt-[25px] rounded-3xl flex justify-center font-bold text-[25px] items-center drop-shadow-2xl">{flyingFrom} → {flyingTo}</div>
          <h1 className="text-3xl font-bold mt-[39px]">Weather</h1>
          <div className="bg-[#BBF7F7] h-fit max-w-[351px] rounded-3xl flex justify-center text-[16px] items-center drop-shadow-2xl text-wrap p-[20px]">{weatherSummery}</div>
          <h1 className="text-3xl font-bold mt-[35px]">Flights</h1>
          <div className="bg-[#BBF7F7] h-fit max-w-[351px] rounded-3xl justify-center text-[16px] items-center drop-shadow-2xl flex flex-col text-wrap p-[20px]">{flightSummery}
            <a href={flightLink} target="_blank" rel="noopener noreferrer" className="w-[324px] h-[47px] border-4 rounded-4xl flex flex-row p-2 text-[25px] font-bold flex items-center justify-center mt-[10px] bg-[#4BDCB0]">
              Book
            </a>
          </div>
          <h1 className="text-3xl font-bold mt-[34px]">Hotel</h1>
          <div className="bg-[#BBF7F7] h-fit max-w-[351px] rounded-3xl flex justify-center text-[16px] items-center drop-shadow-2xl flex flex-col text-wrap p-[20px]">{hotelSummery}
            <a href={hotelLink} target="_blank" rel="noopener noreferrer" className="w-[324px] h-[47px] border-4 rounded-4xl flex flex-row justify-between p-2 text-[25px] font-bold flex items-center justify-center mt-[10px] bg-[#4BDCB0]">
              Book
            </a>
          </div>
        </>

      }

    </main>
  );
}
