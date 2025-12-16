import { useEffect, useRef, useState } from 'react'
import { getForecast, getLocation, getLocationSuggestions, getPrecipitation, getTemperature, getWind } from './utils'
import debounce from 'lodash.debounce'
import useMenuPattern from './hooks/useMenuPattern'
import './App.css'
import { DateTime } from 'luxon'

function App() {
  const [units, setUnits] = useState(initialUnits)
  const [forecast, setForecast] = useState(initialForecast)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState("")
  const [isMenuUnitsOpen, setIsMenuUnitsOpen] = useState(false)
  const [isListboxSuggestionsOpen, setIsListboxSuggestionsOpen] = useState(false)

  const refForm = useRef(null)
  const refMenu = useRef(null)
  const refListbox = useRef(null)
  const refSearchbox = useRef(null)
  
  function handleMenuToggle(e) {
    if (e.newState === "closed") setIsMenuUnitsOpen(false)
    else if (e.newState === "open") setIsMenuUnitsOpen(true)
  }

  function handleSwitchUnitClick() {
    if (units.all === "metric") {
      setUnits({
        all: "imperial",
        precipitation: "in",
        temperature: "f",
        wind: "mph"
      })
    } else if (units.all === "imperial") {
      setUnits({
        all: "metric",
        precipitation: "mm",
        temperature: "c",
        wind: "km/h"
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const location = await getLocation(e.target.elements["location"].value)
    const forecast = location ? await getForecast(location) : null
 
    debouncedGetSuggestions.current.cancel()
    setIsListboxSuggestionsOpen(false)
    setForecast(forecast)
    if (forecast) {
      setSelectedDay(DateTime.fromFormat(
        forecast.today.date,
        "cccc, LLL dd, yyyy",
        { zone: location.timezone }
      ).weekday)
    }
  }

  const debouncedGetSuggestions = useRef(
    debounce(async (searchInput) => {
      const suggestions = await getLocationSuggestions(searchInput)
      setLocationSuggestions(suggestions)
      setSelectedSuggestionId("")
      if (suggestions.length) setIsListboxSuggestionsOpen(true)
      else setIsListboxSuggestionsOpen(false)
    }, 1000)
  )

  function handleSearchChange(e) {
    if (e.target.value.length < 3) {
      setLocationSuggestions([])
      setIsListboxSuggestionsOpen(false)
      debouncedGetSuggestions.current.cancel()
    }
    else debouncedGetSuggestions.current(e.target.value)
  }

  function handleSearchKeyDown(e) {
    const handledKeys = ["ArrowUp", "ArrowDown", "Home", "End", "Enter", "Escape"]
    if (!handledKeys.includes(e.code)) return
    e.preventDefault()

    switch (e.code) {
      case "Enter":
        setIsListboxSuggestionsOpen(false)
        e.target.form.requestSubmit()
        return

      case "Escape":
        setIsListboxSuggestionsOpen(false)
        refSearchbox.current.value = ""
        return
    }

    if (!isListboxSuggestionsOpen) return
    const suggestionsList = document.getElementById(e.target.getAttribute("aria-controls"))
    const firstSuggestion = suggestionsList.firstElementChild
    const lastSuggestion = suggestionsList.lastElementChild
    const activeSuggestion = document.getElementById(selectedSuggestionId)
    const previousSuggestion = activeSuggestion
      ? activeSuggestion.previousElementSibling || lastSuggestion
      : null
    const nextSuggestion = activeSuggestion
      ? activeSuggestion.nextElementSibling || firstSuggestion
      : null

    let targetSuggestion
    switch (e.code) {
      case "ArrowUp":
        if (activeSuggestion) targetSuggestion = previousSuggestion
        else targetSuggestion = lastSuggestion
        break

      case "ArrowDown":
        if (activeSuggestion) targetSuggestion = nextSuggestion
        else targetSuggestion = firstSuggestion
        break

      case "Home":
        targetSuggestion = firstSuggestion
        break

      case "End":
        targetSuggestion = lastSuggestion
        break
    }

    targetSuggestion.scrollIntoView({ block: "nearest" })
    setSelectedSuggestionId(targetSuggestion.id)
    refSearchbox.current.value = targetSuggestion.innerText
  }

  function handleSearchBlur(e) {
    if (!document.hasFocus()) return
    if (e.relatedTarget === document.getElementById("listbox-suggestions")) return
    if (document.getElementById("listbox-suggestions").contains(e.relatedTarget)) return

    setIsListboxSuggestionsOpen(false)
  }

  function handleSuggestionClick(e) {
    if (e.target.role !== "option") return
    setIsListboxSuggestionsOpen(false)
    refSearchbox.current.value = e.target.innerText
    refForm.current.requestSubmit()
  }

  function handleSuggestionsToggle(e) {
    if (e.newState === "closed") setIsListboxSuggestionsOpen(false)
    else if (e.newState === "open") setIsListboxSuggestionsOpen(true)
  }

  function handleClearSearchClick() {
    setIsListboxSuggestionsOpen(false)
    refSearchbox.current.value = ""
    refSearchbox.current.focus()
  }
  
  useEffect(() => {
    if (isMenuUnitsOpen) refMenu.current.showPopover()
    else refMenu.current.hidePopover()
  }, [isMenuUnitsOpen])

  useEffect(() => {
    if (isListboxSuggestionsOpen) refListbox.current.showPopover()
    else refListbox.current.hidePopover()
  }, [isListboxSuggestionsOpen])

  useMenuPattern(refMenu)

  return (
    <>
      <header id="banner">
        <img src="/images/logo.svg" alt="Weather Now app" />
        <button id="menu-units" popoverTarget="menu-items-popup">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M14.125 7.406c.031.407.031.813 0 1.188l1 .594a.74.74 0 0 1 .344.843c-.344 1.313-1.063 2.5-2 3.469-.25.219-.625.281-.906.125l-1-.594c-.25.188-.72.469-1.032.594v1.156a.733.733 0 0 1-.562.719A7.765 7.765 0 0 1 6 15.5c-.313-.063-.563-.406-.563-.719v-1.156a5.54 5.54 0 0 1-1.03-.594l-1 .594c-.282.156-.657.094-.907-.125-.938-.969-1.656-2.156-2-3.469a.74.74 0 0 1 .344-.844l1-.593c-.032-.156-.032-.406-.032-.594 0-.156 0-.406.032-.594l-1-.562A.74.74 0 0 1 .5 6c.344-1.313 1.063-2.5 2-3.469.25-.219.625-.281.906-.125l1 .594c.25-.188.719-.469 1.032-.594V1.25c0-.344.218-.625.562-.719a7.766 7.766 0 0 1 3.969 0c.312.063.562.406.562.719v1.156c.313.125.781.406 1.031.594l1-.594c.282-.156.657-.094.907.125.937.969 1.656 2.156 2 3.469a.74.74 0 0 1-.344.844l-1 .562Zm-1.656 2c.25-1.312.25-1.469 0-2.781l1.375-.781c-.188-.563-.688-1.375-1.063-1.813l-1.375.782c-.969-.844-1.125-.938-2.375-1.375V1.843C8.75 1.812 8.281 1.75 8 1.75c-.313 0-.781.063-1.063.094v1.593c-1.25.438-1.375.532-2.375 1.376L3.188 4.03c-.468.532-.812 1.157-1.062 1.813l1.375.781c-.25 1.313-.25 1.469 0 2.781l-1.375.781c.188.563.688 1.376 1.063 1.813l1.374-.781c.97.844 1.125.937 2.375 1.375v1.594c.282.03.75.093 1.063.093.281 0 .75-.062 1.031-.094v-1.593c1.25-.438 1.375-.531 2.375-1.375l1.375.781c.375-.438.875-1.25 1.063-1.813l-1.375-.78ZM8 5c1.625 0 3 1.375 3 3 0 1.656-1.375 3-3 3a3 3 0 0 1-3-3c0-1.625 1.344-3 3-3Zm0 4.5A1.5 1.5 0 0 0 9.5 8c0-.813-.688-1.5-1.5-1.5A1.5 1.5 0 0 0 6.5 8c0 .844.656 1.5 1.5 1.5Z"/></svg>
          Units
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8"><path d="M6.309 7.484 1.105 2.316c-.175-.14-.175-.421 0-.597l.704-.668a.405.405 0 0 1 .597 0l4.219 4.148 4.184-4.148c.175-.176.457-.176.597 0l.703.668c.176.176.176.457 0 .597L6.906 7.484a.405.405 0 0 1-.597 0Z"/></svg>  
        </button>
        <div id="menu-items-popup" role="menu" popover="auto" ref={refMenu} onToggle={handleMenuToggle}>
          <div
            role="menuitem"
            onClick={handleSwitchUnitClick}>
            {`Switch to ${units.all === "metric" ? "Imperial" : "Metric"}`}
          </div>
          <div role="group" aria-label="Temperature">
            <div
              role="menuitemradio"
              aria-checked={units.temperature === "c" ? "true" : "false"}
              onClick={() => setUnits({ ...units, temperature: "c" })}>
              Celsius (°C)
            </div>
            <div
              role="menuitemradio"
              aria-checked={units.temperature === "f" ? "true" : "false"}
              onClick={() => setUnits({ ...units, temperature: "f" })}>
              Fahrenheit (°F)
            </div>
          </div>
          <div role="separator"></div>
          <div role="group" aria-label="Wind Speed">
            <div
              role="menuitemradio"
              aria-checked={units.wind === "km/h" ? "true" : "false"}
              onClick={() => setUnits({ ...units, wind: "km/h" })}>
              km/h
            </div>
            <div
              role="menuitemradio"
              aria-checked={units.wind === "mph" ? "true" : "false"}
              onClick={() => setUnits({ ...units, wind: "mph" })}>
              mph
            </div>
          </div>
          <div role="separator"></div>
          <div role="group" aria-label="Precipitation">
            <div
              role="menuitemradio"
              aria-checked={units.precipitation === "mm" ? "true" : "false"}
              onClick={() => setUnits({ ...units, precipitation: "mm" })}>
              Millimeters (mm)
            </div>
            <div
              role="menuitemradio"
              aria-checked={units.precipitation === "in" ? "true" : "false"}
              onClick={() => setUnits({ ...units, precipitation: "in" })}>
              Inches (in)
            </div>
          </div>
        </div>
      </header>
      <main>
        <header id="search">
          <h1>How's the sky looking today?</h1>
          <search>
            <form ref={refForm} onSubmit={handleSubmit}>
              <div>
                <input
                  type="text"
                  name="location"
                  placeholder="Search for a place..."
                  required
                  pattern=".*\S.*"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label="Location"
                  aria-description="Use the Up and Down arrow keys to navigate between suggestions and Enter to search"
                  aria-activedescendant={selectedSuggestionId || null}
                  aria-controls="listbox-suggestions"
                  ref={refSearchbox}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onBlur={handleSearchBlur}
                  onInvalid={(e) => e.preventDefault()} />
                <button
                  className="clear-field"
                  type="button"
                  aria-label="Clear Field"
                  onClick={handleClearSearchClick}
                  onMouseDown={e => e.preventDefault()}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </button>
                <div
                  role="listbox"
                  id="listbox-suggestions"
                  aria-label="Autocompletion Suggestions"
                  popover="manual"
                  tabIndex="-1"
                  ref={refListbox}
                  onClick={handleSuggestionClick}
                  onToggle={handleSuggestionsToggle}>
                  {locationSuggestions.map(suggestion => (
                    <div
                      role="option"
                      id={suggestion.id}
                      tabIndex="-1"
                      aria-selected={suggestion.id === selectedSuggestionId}
                      key={suggestion.id}>
                      {`${suggestion.name}, ${suggestion.admin}, ${suggestion.country}`}
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit">Search</button>
            </form>
            <div hidden={forecast} role="alert">No search result found!</div>
          </search>
        </header>
        {forecast &&
        <>
          <div id="forecast-overview">
            <p className="location">{`${forecast.today.name}, ${forecast.today.admin}`}<br />{forecast.today.country}</p>
            <p className="date">{forecast.today.date}</p>
            <p className="condition"><img src={forecast.today.condition.url} alt={forecast.today.condition.alt} /></p>
            <p className="temperature">{`${getTemperature(forecast.today.temperature, units.temperature)}°`}</p>
          </div>
          <dl id="forecast-details" aria-description="forecast details">
            <div><dt>Feels Like</dt><dd>{`${getTemperature(forecast.today.feelsLike, units.temperature)}°`}</dd></div>
            <div><dt>Humidity</dt><dd>{`${forecast.today.humidity}%`}</dd></div>
            <div><dt>Wind</dt><dd>{getWind(forecast.today.wind, units.wind)}</dd></div>
            <div><dt>Precipitation</dt><dd>{`${getPrecipitation(forecast.today.precipitation, units.precipitation)}`}</dd></div>
          </dl>
          <section id="forecast-daily">
            <h2>Daily forecast</h2>
            <ul>
              {forecast.daily.map(item => (
                <li className="daily-forecast" key={item.day}>
                  <p className="day">{item.day}</p>
                  <p className="icon"><img src={item.condition.url} alt={item.condition.alt} /></p>
                  <p className="maximum"><span className="visually-hidden">Maximum of </span>{`${getTemperature(item.maximum, units.temperature)}°`}</p>
                  <p className="minimum"><span className="visually-hidden">Minimum of </span>{`${getTemperature(item.minimum, units.temperature)}°`}</p>
                </li>
              ))}
            </ul>
          </section>
          <section id="forecast-hourly">
            <h2>Hourly forecast</h2>
            <select value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))}>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="7">Sunday</option>
            </select>
            <ul>
              {forecast.hourly[selectedDay - 1].map(item => (
                <li className="hourly-forecast" key={item.hour}>
                  <p className="hour">{item.hour}</p>
                  <p className="icon"><img src={item.condition.url} alt={item.condition.alt} /></p>
                  <p className="temperature">{`${getTemperature(item.temperature, units.temperature)}°`}</p>
                </li>
              ))}
            </ul>
          </section>       
        </>
        }
      </main>
    </>
  )
}

const initialUnits = {
  all: "metric",
  precipitation: "mm",
  temperature: "c",
  wind: "km/h",
}

const initialForecast = {
  today: {
    condition: "sunny",
    date: "Tuesday, Aug 5, 2025",
    feelsLike: "18",
    humidity: "46",
    location: {
      city: "Berlin",
      country: "Germany",
    },
    precipitation: "0",
    temperature: "20",
    wind: "14",
  },
  daily: [
    {
      day: "Tue",
      condition: "rain",
      maximum: "20°",
      minimum: "14°",
    },
    {
      day: "Wed",
      condition: "drizzle",
      maximum: "21°",
      minimum: "15°",
    }
  ],
  hourly: [
    [
      {
        hour: "3PM",
        condition: "overcast",
        temperature: "20°",
      },
      {
        hour: "4PM",
        condition: "partly cloudy",
        temperature: "20°"
      }
    ]
  ]
}

export default App
