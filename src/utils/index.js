import { DateTime } from "luxon"

export async function getLocationSuggestions(searchInput) {
  const parts = searchInput.split(",")

  let search, suggestions
  switch (parts.length) {
    case 1: {
      search = parts[0].trim()
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=10`)
      const data = await response.json()
      suggestions = data.results
      break
    }

    case 2: {
      search = `${parts[0].trim()}, ${parts[1].trim()}`
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=10`)
      const data = await response.json()

      if (data.results) suggestions = data.results
      else {
        search = parts[0].trim()
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=10`)
        const data = await response.json()
        suggestions = data.results.filter(res => res.admin1.toLowerCase() === parts[1].toLowerCase().trim())
      }
      break
    }

    case 3: {
      search = `${parts[0].trim()}, ${parts[2].trim()}`
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=10`)
      const data = await response.json()
      suggestions = data.results.filter(res => res.admin1.toLowerCase() === parts[1].toLowerCase().trim())
      break
    }
  }
  
  if (!suggestions) return []

  return suggestions
    .filter(suggestion => suggestion.admin1 && suggestion.country)
    .map(suggestion => ({
      id: String(suggestion.id),
      name: suggestion.name,
      admin: (suggestion.admin1 === suggestion.name || suggestion.admin1.includes(suggestion.name)) ? null : suggestion.admin1,
      country: suggestion.country,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude
    }))
}

export async function getForecast(location) {
  try {
    const params = new URLSearchParams()
    params.append("latitude", location.latitude)
    params.append("longitude", location.longitude)
    params.append("current", "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code,is_day")
    params.append("daily", "temperature_2m_max,temperature_2m_min,weather_code")
    params.append("hourly", "temperature_2m,weather_code,is_day")
    params.append("timezone", "auto")
    
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    const data = await response.json()
    const hourlyForecasts = data.hourly.time.map((_, i) => ({
      condition: getWeatherIcon({
        code: data.hourly.weather_code[i],
        isDay: data.hourly.is_day[i]
      }),
      hour: getHour(data.hourly.time[i], data.timezone),
      temperature: Math.round(data.hourly.temperature_2m[i])
    }))

    const forecast = {
      today: {
        admin: location.admin,
        condition: getWeatherIcon({
          code: data.current.weather_code,
          isDay: data.current.is_day,
          isAnimated: true,
        }),
        country: location.country,
        date: getDate(new Date().toISOString(), data.timezone),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        name: location.name,
        precipitation: data.current.precipitation,
        temperature: Math.round(data.current.temperature_2m),
        timezone: data.timezone,
        wind: Math.round(data.current.wind_speed_10m),
      },
      daily: data.daily.time.map((_, i) => ({
        day: getDay(data.daily.time[i], data.timezone),
        condition: getWeatherIcon({ code: data.daily.weather_code[i], isDay: true, isAnimated: true }),
        maximum: Math.round(data.daily.temperature_2m_max[i]),
        minimum: Math.round(data.daily.temperature_2m_min[i]),
      })),
      hourly: getStructuredForecasts(hourlyForecasts),
    }

    return forecast
  } catch (error) {
    console.log(error)
  }
}

export function getStructuredForecasts(forecasts) {
  // Split into 7 blocks of 24, representing each day, starting at today
  const chunks = []
  for (let i = 0; i < 7; i++) {
    chunks.push(forecasts.slice(i * 24, (i + 1) * 24))
  }

  // Monday = 0; Tuesday = 1; ...
  const todayIndex = (new Date().getDay() + 6) % 7

  // Reorganize so that the forecasts for Monday come first
  const shift = (7 - todayIndex) % 7

  return [...chunks.slice(shift), ...chunks.slice(0, shift)]
}

export function getDate(date, timezone) {
  return {
    iso: DateTime
      .fromISO(date)
      .setZone(timezone)
      .toISO(),
    local: DateTime
      .fromISO(date)
      .setZone(timezone)
      .setLocale("en-US")
      .toLocaleString({
        day: "numeric",
        month: "short",
        weekday: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }),
  }
}

export function getDay(date, timezone) {
  return {
    short: DateTime.fromISO(date, { zone: timezone }).setLocale("en-US").toLocaleString({ weekday: "short" }),
    long: DateTime.fromISO(date, { zone: timezone }).setLocale("en-US").toLocaleString({ weekday: "long" })
  }
}

export function getHour(date, timezone) {
  return DateTime.fromISO(date, { zone: timezone })
    .setLocale("en-US")
    .toLocaleString({ hour: "numeric" })
}

export async function getLocation(searchInput) {
  const parts = searchInput.split(",")

  let search, location
  switch (parts.length) {
    case 1: {
      search = parts[0].trim()
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=10`)
      const data = await response.json()
      location = data.results?.[0]
      break
    }

    case 2: {
      search = `${parts[0].trim()}, ${parts[1].trim()}`
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=10`)
      const data = await response.json()

      if (data.results) location = data.results?.[0]
      else {
        search = parts[0].trim()
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=10`)
        const data = await response.json()
        location = data.results?.find(res => res.admin1.toLowerCase() === parts[1].toLowerCase().trim())
      }
      break
    }

    case 3: {
      search = `${parts[0].trim()}, ${parts[2].trim()}`
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=10`)
      const data = await response.json()
      location = data.results?.find(res => res.admin1.toLowerCase() === parts[1].toLowerCase().trim())
      break
    }
  }

  if (!location) return null
  return {
    name: location.name,
    admin: (location.admin1 === location.name || location.admin1.includes(location.name)) ? null : location.admin1,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
  }
}

export function getWeatherIcon({ code, isDay, isAnimated = false, format = "png" }) {
  let url, alt, extension
  const folder = isAnimated ? "animated" : "static"
  if (isAnimated) extension = "svg"
  else extension = format

  if ([0, 1].includes(code)) {
    url = `/images/weather-icons/${folder}/${isDay ? "clear-day" : "clear-night"}.${extension}`
    alt = "Clear Sky"
  } else if (code === 2) {
    url = `/images/weather-icons/${folder}/${isDay ? "partly-cloudy-day" : "partly-cloudy-night"}.${extension}`
    alt = "Partly Cloudy"
  } else if (code === 3) {
    url = `/images/weather-icons/${folder}/overcast.${extension}`
    alt = "Overcast"
  } else if ([45, 48].includes(code)) {
    url = `/images/weather-icons/${folder}/fog.${extension}`
    alt = "Fog"
  } else if ([51, 53, 55, 56, 57].includes(code)) {
    url = `/images/weather-icons/${folder}/drizzle.${extension}`
    alt = "Drizzle"
  } else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    url = `/images/weather-icons/${folder}/rain.${extension}`
    alt = "Rain"
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    url = `/images/weather-icons/${folder}/snow.${extension}`
    alt = "Snow"
  } else if ([95, 96, 99].includes(code)) {
    url = `/images/weather-icons/${folder}/thunderstorms.${extension}`
    alt = "Thunderstorms"
  }

  return { url, alt }
}

export function getTemperature(celsiusTemp, toScale) {
  if (toScale === "c") return `${String(celsiusTemp).replace('-', '−')}°`
  else if (toScale === "f") return `${String(Math.round(1.8 * celsiusTemp + 32)).replace('-', '−')}°`
}

export function getWind(kmhWind, toScale) {
  if (toScale === "km/h") return `${kmhWind} km/h`
  else if (toScale === "mph") return `${Math.round(kmhWind * 0.621371)} mph`
}

export function getPrecipitation(mmPrec, toScale) {
  if (toScale === "mm") return `${mmPrec} mm`
  else if (toScale === "in") return `${Math.round(mmPrec / 25.4)} in`
}