import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getFallbackLocation, getForecast, getHumidity, getLocation, getLocationSuggestions, getPrecipitation, getTemperature, getWind } from './utils'
import debounce from 'lodash.debounce'
import useMenuPattern from './hooks/useMenuPattern'
import { DateTime } from 'luxon'

function App() {
  const [units, setUnits] = useState(initialUnits)
  const [forecast, setForecast] = useState(initialForecast)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState("")
  const [isMenuUnitsOpen, setIsMenuUnitsOpen] = useState(false)
  const [isListboxSuggestionsOpen, setIsListboxSuggestionsOpen] = useState(false)
  const [forecastStatusMessage, setForecastStatusMessage] = useState("")
  const [error, setError] = useState(null)
  const [isErrorFocused, setIsErrorFocused] = useState(false)
  const [noSearchAlertKey, setNoSearchAlertKey] = useState(0)

  const refForm = useRef(null)
  const refMenu = useRef(null)
  const refListbox = useRef(null)
  const refSearchbox = useRef(null)
  const refHourlyList = useRef(null)
  const refError = useRef(null)
  const refShouldFocusSearchbox = useRef(false)
  const refPreviousLocationId = useRef(null)
  const refAbortController = useRef(null)
  
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

    const locationInputEl = e.target.elements["location"]
    if (!locationInputEl.value.trim().length) return
    
    debouncedGetSuggestions.current.cancel()
    setIsListboxSuggestionsOpen(false)
    setSelectedSuggestionId("")

    refAbortController.current?.abort()
    const controller = new AbortController()
    refAbortController.current = controller

    let location, forecast
    try {
      location = await getLocation(locationInputEl.value, controller.signal)
      if (location?.id === refPreviousLocationId.current) return
      if (location?.search === refPreviousLocationId.current) return
      refPreviousLocationId.current = location.id || location.search
      
      forecast = location?.id ? await getForecast(location) : null
    } catch (error) {
      if (error.name === "AbortError") return
      refPreviousLocationId.current = null
      setError(error)
    }

    setForecast(forecast)
    if (location?.search) setNoSearchAlertKey(k => k + 1)
    if (forecast) {
      if (refHourlyList.current) refHourlyList.current.scrollTo({ top: 0 })

      setForecastStatusMessage(
        "Forecast for " +
        `${forecast.today.name}, ` +
        `${forecast.today.admin ? forecast.today.admin + ", " : ""}` +
        `${forecast.today.country}: ` +
        `${forecast.today.condition.alt}; ` +
        `${getTemperature(forecast.today.temperature, units.temperature)}.`
      )

      setSelectedDay(DateTime.fromISO(
        new Date().toISOString(),
        { zone: location.timezone }
      ).weekday)
    }
  }

  const debouncedGetSuggestions = useRef(
    debounce(async (searchInput) => {
      try {
        const suggestions = await getLocationSuggestions(searchInput)
        setLocationSuggestions(suggestions)
        setSelectedSuggestionId("")
        if (suggestions.length) setIsListboxSuggestionsOpen(true)
        else {
          setIsListboxSuggestionsOpen(false)
          setSelectedSuggestionId("")
        }
      } catch {
        setLocationSuggestions([])
        setIsListboxSuggestionsOpen(false)
        setSelectedSuggestionId("")
      }
    }, 750)
  )

  function handleSearchChange(e) {
    if (e.target.value.length < 3) {
      debouncedGetSuggestions.current.cancel()
      setLocationSuggestions([])
      setIsListboxSuggestionsOpen(false)
      setSelectedSuggestionId("")
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
        setSelectedSuggestionId("")
        e.target.form.requestSubmit()
        return

      case "Escape":
        setIsListboxSuggestionsOpen(false)
        setSelectedSuggestionId("")
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
    refSearchbox.current.setAttribute("aria-activedescendant", targetSuggestion.id)
    refSearchbox.current.value = targetSuggestion.innerText
    setSelectedSuggestionId(targetSuggestion.id)
  }

  function handleSearchBlur(e) {
    if (!document.hasFocus()) return
    if (e.relatedTarget === document.getElementById("listbox-suggestions")) return
    if (document.getElementById("listbox-suggestions").contains(e.relatedTarget)) return

    setIsListboxSuggestionsOpen(false)
    setForecastStatusMessage("")
  }

  function handleSuggestionClick(e) {
    if (e.target.role !== "option") return
    setIsListboxSuggestionsOpen(false)
    setSelectedSuggestionId("")
    refSearchbox.current.value = e.target.innerText
    refForm.current.requestSubmit()
  }

  function handleSuggestionsToggle(e) {
    if (e.newState === "closed") setIsListboxSuggestionsOpen(false)
    else if (e.newState === "open") setIsListboxSuggestionsOpen(true)
  }

  function handleClearSearchClick() {
    setIsListboxSuggestionsOpen(false)
    setSelectedSuggestionId("")
    refSearchbox.current.value = ""
    refSearchbox.current.focus()
  }

  function handleSelectedDayChange(e) {
    refHourlyList.current.scrollTo({ top: 0, behavior: "smooth" })
    setSelectedDay(Number(e.target.value))
  }

  function handleRetryClick() {
    setIsErrorFocused(false)
    setForecast(initialForecast)
    setForecastStatusMessage("")
    setSelectedDay(1)
    refShouldFocusSearchbox.current = true
  }

  function handleSearchFocus() {
    if (refShouldFocusSearchbox.current) {
      setError(null)
      refShouldFocusSearchbox.current = false
    }
  }
  
  useEffect(() => {
    if (isMenuUnitsOpen) refMenu.current.showPopover()
    else refMenu.current.hidePopover()
  }, [isMenuUnitsOpen])

  useEffect(() => {
    if (isListboxSuggestionsOpen) {
      refListbox.current.showPopover()
      refListbox.current.scrollTo({ top: 0, behavior: "instant" })
    }
    else refListbox.current.hidePopover()
  }, [isListboxSuggestionsOpen])

  useLayoutEffect(() => {
    if (error) refError.current.focus()
  }, [error])

  useLayoutEffect(() => {
    if (!isErrorFocused && refShouldFocusSearchbox.current) refSearchbox.current.focus()
  }, [isErrorFocused])

  useEffect(() => {
    if (!error) {
      async function getInitialForecast() {
        refAbortController.current?.abort()
        const controller = new AbortController()
        refAbortController.current = controller
        
        setForecast(initialForecast)
        try {
          const fallbackLocation = await getFallbackLocation()
          const forecast = await getForecast(fallbackLocation, controller.signal)

          if (forecast) {
            setForecast(forecast)
            setForecastStatusMessage(
              "Forecast for " +
              `${forecast.today.name}, ` +
              `${forecast.today.admin ? forecast.today.admin + ", " : ""}` +
              `${forecast.today.country}: ` +
              `${forecast.today.condition.alt}; ` +
              `${getTemperature(forecast.today.temperature, "c")};`
            )
            setSelectedDay(DateTime.fromISO(
              new Date().toISOString(),
              { zone: fallbackLocation.timezone }
            ).weekday)
          }
        } catch {
          return
        }
      }

      getInitialForecast()
    }
  }, [error])

  const location = (
    `${forecast?.today?.name}, ` +
    `${forecast?.today?.admin ? forecast.today.admin + ", " : ""}` +
    `${forecast?.today?.country}`
  )

  function getDailyForecast(item) {
    return (
      `${item.day.long}, ` +
      `${item.condition.alt}, ` +
      `maximum of ${getTemperature(item.maximum, units.temperature)}, ` +
      `minimum of ${getTemperature(item.minimum, units.temperature)}.`
    )
  }

  function getHourlyForecast(item) {
    return (
      `${item.hour}, ` +
      `${item.condition.alt}, ` +
      `${getTemperature(item.temperature, units.temperature)}.`
    )
  }
 
  useMenuPattern(refMenu)

  return (
    <>
      <header id="banner" inert={isErrorFocused}>
        <img className="logo" src="/images/logo.svg" alt="The Weather Now app" />
        <button popoverTarget="menu-items-popup" aria-haspopup="menu">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M14.125 7.406c.031.407.031.813 0 1.188l1 .594a.74.74 0 0 1 .344.843c-.344 1.313-1.063 2.5-2 3.469-.25.219-.625.281-.906.125l-1-.594c-.25.188-.72.469-1.032.594v1.156a.733.733 0 0 1-.562.719A7.765 7.765 0 0 1 6 15.5c-.313-.063-.563-.406-.563-.719v-1.156a5.54 5.54 0 0 1-1.03-.594l-1 .594c-.282.156-.657.094-.907-.125-.938-.969-1.656-2.156-2-3.469a.74.74 0 0 1 .344-.844l1-.593c-.032-.156-.032-.406-.032-.594 0-.156 0-.406.032-.594l-1-.562A.74.74 0 0 1 .5 6c.344-1.313 1.063-2.5 2-3.469.25-.219.625-.281.906-.125l1 .594c.25-.188.719-.469 1.032-.594V1.25c0-.344.218-.625.562-.719a7.766 7.766 0 0 1 3.969 0c.312.063.562.406.562.719v1.156c.313.125.781.406 1.031.594l1-.594c.282-.156.657-.094.907.125.937.969 1.656 2.156 2 3.469a.74.74 0 0 1-.344.844l-1 .562Zm-1.656 2c.25-1.312.25-1.469 0-2.781l1.375-.781c-.188-.563-.688-1.375-1.063-1.813l-1.375.782c-.969-.844-1.125-.938-2.375-1.375V1.843C8.75 1.812 8.281 1.75 8 1.75c-.313 0-.781.063-1.063.094v1.593c-1.25.438-1.375.532-2.375 1.376L3.188 4.03c-.468.532-.812 1.157-1.062 1.813l1.375.781c-.25 1.313-.25 1.469 0 2.781l-1.375.781c.188.563.688 1.376 1.063 1.813l1.374-.781c.97.844 1.125.937 2.375 1.375v1.594c.282.03.75.093 1.063.093.281 0 .75-.062 1.031-.094v-1.593c1.25-.438 1.375-.531 2.375-1.375l1.375.781c.375-.438.875-1.25 1.063-1.813l-1.375-.78ZM8 5c1.625 0 3 1.375 3 3 0 1.656-1.375 3-3 3a3 3 0 0 1-3-3c0-1.625 1.344-3 3-3Zm0 4.5A1.5 1.5 0 0 0 9.5 8c0-.813-.688-1.5-1.5-1.5A1.5 1.5 0 0 0 6.5 8c0 .844.656 1.5 1.5 1.5Z"/></svg>
          Units
          <svg className="icon-chevron" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8"><path d="M6.309 7.484 1.105 2.316c-.175-.14-.175-.421 0-.597l.704-.668a.405.405 0 0 1 .597 0l4.219 4.148 4.184-4.148c.175-.176.457-.176.597 0l.703.668c.176.176.176.457 0 .597L6.906 7.484a.405.405 0 0 1-.597 0Z"/></svg>  
        </button>
        <div id="menu-items-popup" role="menu" popover="auto" ref={refMenu} onToggle={handleMenuToggle}>
          <div
            role="menuitem"
            onClick={handleSwitchUnitClick}>
            {`Switch to ${units.all === "metric" ? "Imperial" : "Metric"}`}
          </div>
          <div role="group" aria-labelledby="label-temperature">
            <div id="label-temperature">Temperature</div>
            <div
              role="menuitemradio"
              aria-label="Celsius"
              aria-checked={units.temperature === "c" ? "true" : "false"}
              onClick={() => setUnits({ ...units, temperature: "c" })}>
              Celsius (°C)
            </div>
            <div
              role="menuitemradio"
              aria-label="Fahrenheit"
              aria-checked={units.temperature === "f" ? "true" : "false"}
              onClick={() => setUnits({ ...units, temperature: "f" })}>
              Fahrenheit (°F)
            </div>
          </div>
          <div role="separator" />
          <div role="group" aria-labelledby="label-wind">
            <div id="label-wind">Wind Speed</div>
            <div
              role="menuitemradio"
              aria-label="Kilometers per hour"
              aria-checked={units.wind === "km/h" ? "true" : "false"}
              onClick={() => setUnits({ ...units, wind: "km/h" })}>
              km/h
            </div>
            <div
              role="menuitemradio"
              aria-label="Miles per hour"
              aria-checked={units.wind === "mph" ? "true" : "false"}
              onClick={() => setUnits({ ...units, wind: "mph" })}>
              mph
            </div>
          </div>
          <div role="separator" />
          <div role="group" aria-labelledby="label-precipitation">
            <div id="label-precipitation">Precipitation</div>
            <div
              role="menuitemradio"
              aria-label="Millimeters"
              aria-checked={units.precipitation === "mm" ? "true" : "false"}
              onClick={() => setUnits({ ...units, precipitation: "mm" })}>
              Millimeters (mm)
            </div>
            <div
              role="menuitemradio"
              aria-label="Inches"
              aria-checked={units.precipitation === "in" ? "true" : "false"}
              onClick={() => setUnits({ ...units, precipitation: "in" })}>
              Inches (in)
            </div>
          </div>
        </div>
      </header>


      {error &&
        <div className="error">
          <p ref={refError} tabIndex="-1" onFocus={() => setIsErrorFocused(true)}>
            <strong>Something went wrong</strong>
          </p>
          <p>We couldn't connect to the server. Please try again in a few moments.</p>
          <button onClick={handleRetryClick} onMouseDown={e => e.preventDefault()}>
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17"><path d="M15.094 1.406c.25-.25.656-.062.656.25v4.469a.38.38 0 0 1-.375.375h-4.5a.36.36 0 0 1-.25-.625l1.688-1.688A5.992 5.992 0 0 0 8 2.375a6.134 6.134 0 0 0-6.125 5.781c-.031.219-.188.344-.375.344H.625c-.219 0-.406-.156-.375-.375C.438 4.031 3.844.75 8 .75c2.125 0 4.063.875 5.469 2.281l1.625-1.625Zm.25 7.094c.219 0 .406.188.375.406C15.53 13 12.125 16.25 8 16.25c-2.156 0-4.094-.844-5.5-2.25L.875 15.625a.36.36 0 0 1-.625-.25v-4.5a.38.38 0 0 1 .375-.375h4.469c.312 0 .5.406.25.656l-1.688 1.688C4.75 13.969 6.281 14.625 8 14.625a6.1 6.1 0 0 0 6.094-5.75c.031-.219.187-.375.375-.375h.875Z"/></svg>
            Retry
          </button>
        </div>
      }


      {!isErrorFocused &&
        <main>
          <header id="search">
            <h1>How's the sky looking today?</h1>
            <div className="visually-hidden" role="status">{forecast ? forecastStatusMessage : ""}</div>
            <search>
              <form ref={refForm} onSubmit={handleSubmit}>
                <svg className="icon-search" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21"><path d="M19.844 18.82c.195.196.195.508 0 .664l-.899.899c-.156.195-.468.195-.664 0l-4.726-4.727a.63.63 0 0 1-.117-.351v-.508c-1.446 1.21-3.282 1.953-5.313 1.953A8.119 8.119 0 0 1 0 8.625C0 4.172 3.633.5 8.125.5c4.453 0 8.125 3.672 8.125 8.125 0 2.031-.781 3.906-1.992 5.313h.508c.117 0 .234.078.351.156l4.727 4.726ZM8.125 14.875a6.243 6.243 0 0 0 6.25-6.25c0-3.438-2.813-6.25-6.25-6.25a6.243 6.243 0 0 0-6.25 6.25 6.219 6.219 0 0 0 6.25 6.25Z"/></svg>                  
                <input
                  type="text"
                  name="location"
                  placeholder="Search for a place..."
                  autoComplete="off"
                  spellCheck="false"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="listbox-suggestions"
                  aria-haspopup="listbox"
                  aria-expanded={isListboxSuggestionsOpen}
                  aria-activedescendant={selectedSuggestionId || null}
                  ref={refSearchbox}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onBlur={handleSearchBlur}
                  onFocus={handleSearchFocus} />
                <div
                  id="listbox-suggestions"
                  role="listbox"
                  aria-label="Suggestions"
                  popover="manual"
                  tabIndex="-1"
                  ref={refListbox}
                  onClick={handleSuggestionClick}
                  onMouseDown={e => e.preventDefault()}
                  onToggle={handleSuggestionsToggle}>
                  {locationSuggestions.map(suggestion => (
                    <div
                      id={suggestion.id}
                      role="option"
                      tabIndex="-1"
                      aria-selected={suggestion.id === selectedSuggestionId}
                      key={suggestion.id}>
                      {
                        `${suggestion.name}, ` +
                        `${suggestion.admin ? suggestion.admin + ", " : ""}` +
                        `${suggestion.country}`
                      }
                    </div>
                  ))}
                </div>
                <button
                  className="clear-field"
                  type="button"
                  aria-label="Clear Field"
                  onClick={handleClearSearchClick}
                  onMouseDown={e => e.preventDefault()}>
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </button>
                <button type="submit">Search</button>
              </form>
              {!error && !forecast &&
                <div role="alert" key={noSearchAlertKey}>No search result found!</div>
              }
            </search>
          </header>


          {forecast &&
          <>
            <section id="forecast-details" inert={!forecast.today}>
              <h2 className="visually-hidden">Forecast details</h2>
              <div className={`overview${!forecast.today ? " loading" : ""}`}>
                {forecast.today &&
                  <>
                    <p className="location">{location}</p>
                    <p className="date">{forecast.today.date.local}</p>
                    <p className="weather">
                      <span className="visually-hidden">{`${forecast.today.condition.alt}, ${getTemperature(forecast.today.temperature, units.temperature)}`}</span>
                      <img aria-hidden="true" src={forecast.today.condition.url} alt="" title={forecast.today.condition.alt} />
                      <span aria-hidden="true">{getTemperature(forecast.today.temperature, units.temperature)}</span>
                    </p>
                  </>
                }
                {!forecast.today &&
                  <>
                    <img className="icon-loading" src="/images/icon-loading.svg" alt="" />
                    <span>Loading...</span>
                  </>
                }
              </div>
              <ul className="details">
                <li>
                  <span className="visually-hidden">{`Feels like: ${getTemperature(forecast.today?.feelsLike, units.temperature)}`}</span>
                  <div className="contents" aria-hidden="true">
                    <span className="label">Feels Like</span>
                    <span className="value">{getTemperature(forecast.today?.feelsLike, units.temperature)}</span>
                  </div>
                </li>
                <li>
                  <span className="visually-hidden">{`Humidity: ${getHumidity(forecast.today?.humidity)}`}</span>
                  <div className="contents" aria-hidden="true">
                    <span className="label">Humidity</span>
                    <span className="value">{getHumidity(forecast.today?.humidity)}</span>
                  </div>
                </li>
                <li>
                  <span className="visually-hidden">{`Wind: ${getWind(forecast.today?.wind, units.wind)}`}</span>
                  <div className="contents" aria-hidden="true">
                    <span className="label">Wind</span>
                    <span className="value">{getWind(forecast.today?.wind, units.wind)}</span>
                  </div>
                </li>
                <li>
                  <span className="visually-hidden">{`Precipitation: ${getPrecipitation(forecast.today?.precipitation, units.precipitation)}`}</span>
                  <div className="contents" aria-hidden="true">
                    <span className="label">Precipitation</span>
                    <span className="value">{getPrecipitation(forecast.today?.precipitation, units.precipitation)}</span>
                  </div>
                </li>
              </ul>
            </section>


            <section id="forecast-daily" inert={!forecast.today}>
              <h2>Daily forecast</h2>
              <ul>
                {forecast.daily.map((item, i) => (
                  <li key={item?.day.long || i}>
                    {item &&
                      <>
                        <span className="visually-hidden">{getDailyForecast(item)}</span>
                        <div className="contents" aria-hidden="true">
                          <span className="day">{item.day.short}</span>
                          <img className="condition" src={item.condition.url} alt="" title={item.condition.alt} />
                          <span className="maximum" title="maximum">{getTemperature(item.maximum, units.temperature)}</span>
                          <span className="minimum" title="minimum">{getTemperature(item.minimum, units.temperature)}</span>
                        </div>
                      </>
                    }
                  </li>
                ))}
              </ul>
            </section>


            <section id="forecast-hourly" inert={!forecast.today}>
              <h2>Hourly forecast</h2>
              <select value={selectedDay} aria-label="Select a day" onChange={handleSelectedDayChange}>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="7">Sunday</option>
              </select>
              <ul ref={refHourlyList}>
                {forecast.hourly[selectedDay - 1].map((item, i) => (
                  <li key={item?.hour || i}>
                    {item && 
                      <>
                        <span className="visually-hidden">{getHourlyForecast(item)}</span>
                        <div className="contents" aria-hidden="true">
                          <img className="condition" src={item.condition.url} alt="" title={item.condition.alt} />
                          <span className="hour">{item.hour}</span>
                          <span className="temperature">{getTemperature(item.temperature, units.temperature)}</span>
                        </div>
                      </>
                    }
                  </li>
                ))}
              </ul>
            </section>       
          </>
          }
        </main>
      }
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
  today: null,
  daily: new Array(7).fill(null),
  hourly: [new Array(24).fill(null)]
}

export default App
