import { useEffect, useRef, useState } from 'react'
import { useForecastSearchController } from './hooks/useSearchForecast'
import Banner from './components/Banner'
import Search from './components/Search'
import View from './components/View'
import Error from './components/Error'

function App() {
  const [status, setStatus] = useState("idle")
  const [forecast, setForecast] = useState(null)
  const [units, setUnits] = useState(initialUnits)
  const [selectedDay, setSelectedDay] = useState(null)

  const refSearch = useRef(null)
  const refAlreadySearched = useRef(null)

  const startForecastSearch = useForecastSearchController()



  async function onSearch(searchInput) {
    refAlreadySearched.current = true
    startForecastSearch({
      search: searchInput,
      onWait: () => {
        setStatus("loading")
      },
      onResult: (result) => {
        setStatus("success")
        setForecast(result)
        setSelectedDay(0)
      },
      onError: () => {
        setStatus("error")
      }
    })
  }



  function onUnitsChange(unit) {
    let { all, temperature, precipitation, wind } = units
    switch (unit) {
      case "celsius": temperature = "c"; break
      case "fahrenheit": temperature = "f"; break
      case "kilometer": wind = "km/h"; break
      case "mile": wind = "mph"; break
      case "millimeter": precipitation = "mm"; break
      case "inch": precipitation = "in"; break
      case "switch":
        if (units.all === "metric") {
          all = "imperial"
          precipitation = "in"
          temperature = "f"
          wind = "mph"
        } else if (units.all === "imperial") {
          all = "metric"
          precipitation = "mm"
          temperature = "c"
          wind = "km/h"
        }
    }

    setUnits({all, temperature, precipitation, wind})
  }



  useEffect(() => {
    navigator.permissions.query({ name: "geolocation" }).then(async (result) => {
      if (result.state === "denied") return
      else if (result.state === "granted" || result.state === "prompt") {
        setStatus("loading")
        
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (refAlreadySearched.current) return
            
            startForecastSearch({
              search: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              },
              onResult: (result) => {
                setStatus("success")
                setForecast(result)
                setSelectedDay(0)
              },
              onError: () => {
                setStatus("error")
              }
            })
          },
          (error) => {
            if (error.PERMISSION_DENIED) setStatus("idle")
            else setStatus("error")
          },
          { enableHighAccuracy: true, maximumAge: 300_000 }
        )
      }
    })
  }, [startForecastSearch])



  useEffect(() => {
    if (status !== "idle") return
    if (!refAlreadySearched.current) return
    refSearch.current.focusSearchField()
  }, [status])



  return (
    <>
      <Banner
        units={units}
        inert={status === "error" ? true : false}
        onUnitsChange={onUnitsChange}
      />
      <main>
        <Search
          status={status}
          ref={refSearch}
          onSearch={onSearch}
        />
        <View
          status={status}
          forecast={forecast}
          units={units}
          selectedDay={selectedDay}
          onSelectDay={(day) => setSelectedDay(day)}
        />
      </main>
      <Error
        hidden={status !== "error" ? true : false}
        onRetry={() => setStatus("idle")}
      />
    </>
  )
}

const initialUnits = {
  all: "metric",
  precipitation: "mm",
  temperature: "c",
  wind: "km/h",
}

export default App