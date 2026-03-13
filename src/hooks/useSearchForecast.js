import { DateTime } from "luxon"
import { useCallback, useRef } from "react"

export function useForecastSearchController() {
  const refController = useRef(null)
  const refLoaderTimer = useRef(null)
  const refDisplayTimer = useRef(null)
  
  const searchForecast = useCallback(async ({ search, onWait, onResult, onError }) => {
    refController.current?.abort()
    clearTimeout(refLoaderTimer.current)
    clearTimeout(refDisplayTimer.current)

    const controller = new AbortController()
    refController.current = controller

    let loaderShownAt
    let state
    let forecast

    if (onWait) {
      refLoaderTimer.current = setTimeout(() => {
        onWait()
        loaderShownAt = Date.now()
      }, 200)
    }

    try {
      const location = search.latitude ?? search.longitude
        ? await getLocationByCoords({ coords: search, signal: controller.signal })
        : await getLocationByName({ search, signal: controller.signal })
      forecast = location ? await getForecast({ location, signal: controller.signal }) : null
      state = "success"
    } catch (error) {
      if (error.name === "AbortError") return
      state = "error"
    }

    clearTimeout(refLoaderTimer.current)

    const elapsed = loaderShownAt ? Date.now() - loaderShownAt : 0
    const remaining = loaderShownAt ? Math.max(0, 750 - elapsed) : 0
    refDisplayTimer.current = setTimeout(() => {
      if (state === "success") onResult(forecast)
      else if (state === "error") onError()
    }, remaining);
  }, [])

  return searchForecast
}



async function getLocationByName({ search, signal }) {
  const parts = search
    .split(",")
    .map(part => part.trim().toLowerCase())
  
  let name
  if (parts.length === 1 || parts.length === 2) name = parts[0]
  else if (parts.length === 3) name = `${parts[0]}, ${parts[2]}`

  
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=10`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)  
  const data = await res.json()

  if (!data.results) return null

  let location
  switch (parts.length) {
    case 1:
      location = data.results.find(res => res.name.toLowerCase() === parts[0])
      break
    case 2:
      location =
        data.results.find(res => res.name.toLowerCase() === parts[0] && res.admin1.toLowerCase() === parts[1]) ||
        data.results.find(res => res.name.toLowerCase() === parts[0] && res.country.toLowerCase() === parts[1])
      break
    case 3:
      location = data.results.find(res => (
        res.name.toLowerCase() === parts[0] &&
        res.admin1.toLowerCase() === parts[1] &&
        res.country.toLowerCase() === parts[2]
      ))
  }

  if (!location) return null
  if (location.name === location.country) return null

  return {
    name: location.name,
    admin: location.admin1,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
  }
}



async function getLocationByCoords({ coords, signal }) {
  const params = new URLSearchParams({
    latitude: coords.latitude,
    longitude: coords.longitude
  })

  const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  return {
    name: data.locality,
    admin: data.principalSubdivision,
    country: data.countryName,
    latitude: coords.latitude,
    longitude: coords.longitude,
  }
}



async function getForecast({ location, signal }) {
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code,is_day",
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    hourly: "temperature_2m,weather_code,is_day",
    timezone: "auto"
  })
  
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  return {
    name: location.name,
    admin: location.admin,
    country: location.country,
    time: DateTime.now().setZone(data.timezone).toISO({ suppressMilliseconds: true }),
    isDay: data.current.is_day,
    timezone: data.timezone,
    weatherCode: data.current.weather_code,
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    wind: data.current.wind_speed_10m,
    precipitation: data.current.precipitation,
    daily: data.daily.time.map((time, i) => ({
      time,
      weatherCode: data.daily.weather_code[i],
      maximum: data.daily.temperature_2m_max[i],
      minimum: data.daily.temperature_2m_min[i],
    })),
    hourly: data.hourly.time.map((time, i) => ({
      time: DateTime.fromISO(time, { zone: data.timezone }).toISO({ suppressMilliseconds: true }),
      isDay: data.hourly.is_day[i],
      weatherCode: data.hourly.weather_code[i],
      temperature: data.hourly.temperature_2m[i],
    })),
  }
}