import { useEffect, useId, useRef } from "react"
import { DateTime } from "luxon"

function View({ status, forecast, units, selectedDay, onSelectDay }) {
  const refHourlyList = useRef(null)



  function handleChange(e) {
    refHourlyList.current.scrollTo({ top: 0, behavior: "smooth" })
    onSelectDay(Number(e.target.value))
  }



  useEffect(() => {
    refHourlyList.current?.scrollTo({ top: 0, behavior: "instant" })
  }, [forecast])



  const isLoading = status === "loading"
  const isEmpty = status === "success" && !forecast
  const isDisplaying = status === "success" && forecast
  const location = isDisplaying ? getLocation({ name: forecast.name, admin: forecast.admin, country: forecast.country }) : ""
  const date = isDisplaying ? getDate(forecast.time, forecast.timezone) : {}
  const condition = isDisplaying ? getWeatherIcon({ code: forecast.weatherCode, isDay: forecast.isDay }) : {}
  const temperature = isDisplaying ? getTemperature(forecast.temperature, units.temperature) : ""
  const feelsLike = isDisplaying ? getTemperature(forecast.feelsLike, units.temperature) : ""
  const humidity = isDisplaying ? getHumidity(forecast.humidity) : ""
  const wind = isDisplaying ? getWind(forecast.wind, units.wind) : ""
  const precipitation = isDisplaying ? getPrecipitation(forecast.precipitation, units.precipitation) : ""
  const dailyItems = isDisplaying
    ? getDailyItems({ items: forecast.daily, units: units, timezone: forecast.timezone })
    : dailySlots
  const hourlyItems = isDisplaying
    ? getHourlyItems({ items: forecast.hourly.slice(selectedDay * 24, selectedDay * 24 + 24), units: units, timezone: forecast.timezone })
    : hourlySlots
  const idDailyLable = useId()
  const idHourlyLable = useId()

  return (
    <div id="view">
      {(isLoading || isDisplaying) && (
        <>
          <div role="region" className="details" inert={isLoading} aria-label="Forecast details">
            <div className="overview">
              <p className="location">{location}</p>
              <p className="date"><time dateTime={date?.iso || null}>{date?.formatted}</time></p>
              <div className="weather">
                {isDisplaying && <img className="condition" src={condition.src} alt={condition.alt} />}
                <p className="temperature">{temperature}</p>
              </div>
            </div>
            <dl>
              <div><dt>Feels Like</dt><dd>{feelsLike}</dd></div>
              <div><dt>Humidity</dt><dd>{humidity}</dd></div>
              <div><dt>Wind</dt><dd>{wind}</dd></div>
              <div><dt>Precipitation</dt><dd>{precipitation}</dd></div>
            </dl>
          </div>


          <div role="region" className="daily" inert={isLoading} aria-labelledby={idDailyLable}>
            <div id={idDailyLable} className="title">Daily forecast</div>
            <ul>
              {dailyItems.map((item, i) => (
                <li key={i}>
                  <p className="day">
                    <time dateTime={item?.day.iso}>
                      <span className='visually-hidden'>{item?.day.long}</span>
                      <span aria-hidden="true">{item?.day.short}</span>
                    </time>
                  </p>
                  {isDisplaying && <img className="condition" src={item.condition.src} alt={item.condition.alt} />}
                  <p className="maximum"><span className="visually-hidden">Maximum of </span> {item?.maximum}</p>
                  <p className="minimum"><span className="visually-hidden">Minimum of </span> {item?.minimum}</p>
                </li>
              ))}
            </ul>
          </div>


          <div role="region" className="hourly" inert={isLoading} aria-labelledby={idHourlyLable}>
            <div id={idHourlyLable} className="title">Hourly forecast</div>
            <select value={selectedDay ?? 0} aria-label="Day" onChange={handleChange}>
              {dailyItems.map((item, i) => (
                <option value={i} key={i}>{item?.day.long || "-"}</option>
              ))}
            </select>
            <ul ref={refHourlyList}>
              {hourlyItems.map((item, i) => (
                <li key={i}>
                  <p className="hour"><time dateTime={item?.hour.iso}>{item?.hour.formatted}</time></p>
                  {isDisplaying && <img className="condition" src={item.condition.src} alt={item.condition.alt} />}
                  <p className="temperature">{item?.temperature}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <div role="alert">{isEmpty ? "No search result found!" : ""}</div>
      <div role="status" className="loading">{isLoading ? "Loading" : ""}</div>
      <div role="status" className="visually-hidden">{isDisplaying ? "Forecast updated" : ""}</div>
    </div>
  )
}

const dailySlots = Array(7).fill(null)
const hourlySlots = Array(24).fill(null)

function getLocation({ name, admin, country }) {
  return (
    `${name}, ` +
    (admin === name || admin?.includes(name) ? "" : `${admin}, `) +
    country
  )
}

function getDate(date, timezone) {
  return {
    iso: date,
    formatted: DateTime
      .fromISO(date, { zone: timezone })
      .setLocale("en-US")
      .toLocaleString({
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }),
  }
}

function getDay(date, timezone) {
  return {
    iso: date,
    short: DateTime.fromISO(date, { zone: timezone }).setLocale("en-US").toLocaleString({ weekday: "short" }),
    long: DateTime.fromISO(date, { zone: timezone }).setLocale("en-US").toLocaleString({ weekday: "long" })
  }
}

function getHour(date, timezone) {
  return {
    iso: date,
    formatted: DateTime.fromISO(date, { zone: timezone }).setLocale("en-US").toLocaleString({ hour: "numeric" })
  }
}

function getWeatherIcon({ code, isDay, isAnimated = false, format = "svg" }) {
  let fileName, alt
  if ([0, 1].includes(code)) {
    fileName = isDay ? "clear-day" : "clear-night"
    alt = "Clear sky"
  } else if (code === 2) {
    fileName = isDay ? "partly-cloudy-day" : "partly-cloudy-night"
    alt = "Partly cloudy"
  } else if (code === 3) {
    fileName = "overcast"
    alt = "Overcast"
  } else if ([45, 48].includes(code)) {
    fileName = "fog"
    alt = "Fog"
  } else if ([51, 53, 55, 56, 57].includes(code)) {
    fileName = "drizzle"
    alt = "Drizzle"
  } else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    fileName = "rain"
    alt = "Rain"
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    fileName = "snow"
    alt = "Snow"
  } else if ([95, 96, 99].includes(code)) {
    fileName = "thunderstorms"
    alt = "Thunderstorms"
  }

  const src = `/images/weather-icons/${isAnimated ? "animated" : "static"}/${fileName}.${isAnimated ? "svg" : format}`

  return { src, alt }
}

function getTemperature(celsiusTemp, toScale) {
  if (toScale === "c") return `${String(Math.round(celsiusTemp)).replace('-', '−')}°`
  else if (toScale === "f") return `${String(Math.round(1.8 * celsiusTemp + 32)).replace('-', '−')}°`
}

function getHumidity(humidity) {
  return `${Math.round(humidity)}%`
}

function getWind(kmhWind, toScale) {
  if (toScale === "km/h") return `${Math.round(kmhWind)} km/h`
  else if (toScale === "mph") return `${Math.round(kmhWind * 0.621371)} mph`
}

function getPrecipitation(mmPrec, toScale) {
  if (toScale === "mm") return `${mmPrec} mm`
  else if (toScale === "in") return `${Math.round(mmPrec / 25.4)} in`
}

function getDailyItems({ items, units, timezone }) {
  return items.map(item => ({
    day: getDay(item.time, timezone),
    condition: getWeatherIcon({ code: item.weatherCode, isDay: true }),
    maximum: getTemperature(item.maximum, units.temperature),
    minimum: getTemperature(item.minimum, units.temperature),
  }))
}

function getHourlyItems({ items, units, timezone }) {
  return items.map(item => ({
    hour: getHour(item.time, timezone),
    condition: getWeatherIcon({ code: item.weatherCode, isDay: item.isDay, format: "png" }),
    temperature: getTemperature(item.temperature, units.temperature)
  }))
}

export default View