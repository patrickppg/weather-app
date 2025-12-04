import { DateTime } from "luxon"

// async function getLocationSuggestions(location) {
//   try {
//     const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=5`)
//     const data = await response.json()
//     const suggestions = data.results.map(item => ({
//       name: item.name,
//       admin1: item.admin1,
//       country: item.country,
//       latitude: item.latitude,
//       longitude: item.longitude
//     }))

//     return suggestions
//   } catch (error) {
//     console.log(error)
//   }
// }

export async function getForecast(location) {
  try {
    const params = new URLSearchParams()
    params.append("latitude", location.latitude)
    params.append("longitude", location.longitude)
    params.append("current", "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code")
    params.append("daily", "temperature_2m_max,temperature_2m_min,weather_code")
    params.append("hourly", "temperature_2m,weather_code")
    params.append("timezone", "auto")
    
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    const data = await response.json()
    const hourlyForecasts = data.hourly.time.map((_, i) => ({
      condition: getCondition(data.hourly.weather_code[i]),
      hour: getHour(data.hourly.time[i], data.timezone),
      temperature: Math.round(data.hourly.temperature_2m[i])
    }))

    const forecast = {
      today: {
        condition: getCondition(data.current.weather_code),
        country: location.country,
        date: getDate(data.current.time, data.timezone),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        location: `${data.latitude}, ${data.longitude}`,
        name: location.name,
        precipitation: data.current.precipitation,
        temperature: Math.round(data.current.temperature_2m),
        timezone: data.timezone,
        wind: Math.round(data.current.wind_speed_10m),
      },
      daily: data.daily.time.map((_, i) => ({
        day: getDay(data.daily.time[i], data.timezone),
        condition: getCondition(data.daily.weather_code[i]),
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
  return DateTime.fromISO(date, { zone: timezone })
    .setLocale("en-US")
    .toLocaleString({
      day: "numeric",
      month: "short",
      weekday: "long",
      year: "numeric",
    })
}

export function getDay(date, timezone) {
  return DateTime.fromISO(date, { zone: timezone })
    .setLocale("en-US")
    .toLocaleString({ weekday: "short" })
}

export function getHour(date, timezone) {
  return DateTime.fromISO(date, { zone: timezone })
    .setLocale("en-US")
    .toLocaleString({ hour: "numeric" })
}

export async function getLocation(location) {
  const params = new URLSearchParams()
  params.append("name", location)
  params.append("count", "5")
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  const data = await response.json()

  return {
    name: data.results[0].name,
    admin1: data.results[0].admin1,
    country: data.results[0].country,
    latitude: data.results[0].latitude,
    longitude: data.results[0].longitude,
  }
}

export function getCondition(code) {
  let url, alt

  switch (code) {
    case 0:
    case 1:
      url = "/images/icon-sunny.webp"
      alt = "clear sky"
      break

    case 2:
      url = "/images/icon-partly-cloudy.webp"
      alt = "partly cloudy"
      break

    case 3:
      url = "/images/icon-overcast.webp"
      alt = "overcast"
      break

    case 45:
    case 48:
      url = "/images/icon-fog.webp"
      alt = "fog"
      break

    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      url = "/images/icon-drizzle.webp"
      alt = "drizzle"
      break

    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      url = "/images/icon-rain.webp"
      alt = "rain"
      break

    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      url = "/images/icon-snow.webp"
      alt = "snow"
      break

    case 95:
    case 96:
    case 99:
      url = "/images/icon-storm.webp"
      alt = "thunderstorms"
      break
  }

  return { url, alt }
}

export function getTemperature(celsiusTemp, toScale) {
  if (toScale === "c") return celsiusTemp
  else if (toScale === "f") return Math.round(1.8 * celsiusTemp + 32)
}

export function getWind(kmhWind, toScale) {
  if (toScale === "km/h") return `${kmhWind}km/h`
  else if (toScale === "mph") return `${Math.round(kmhWind * 0.621371)}mph`
}

export function getPrecipitation(mmPrec, toScale) {
  if (toScale === "mm") return `${mmPrec}mm`
  else if (toScale === "in") return `${Math.round(mmPrec / 25.4)}in`
}