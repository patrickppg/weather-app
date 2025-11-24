import { useState } from 'react'
import './App.css'

function App() {
  const [forecast, setForecast] = useState(initialForecast)
  
  return (
    <>
      <header>
        <img src="/images/logo.svg" alt="Weather Now app" />
        <button>Units</button>
      </header>
      <main>
        <header>
          <h1>How's the sky looking today?</h1>
          <search>
            <form action="get">
              <input type="search" placeholder="Search for a place..." aria-label="Location" />
              <button type="submit">Search</button>
            </form>
          </search>
        </header>
        <div>
          <p>{`${forecast.location.city}, ${forecast.location.country}`}</p>
          <p>{forecast.date}</p>
          <p>{forecast.condition}</p>
          <p>{forecast.temperature}</p>
        </div>
        <dl aria-description="forecast details">
          <div><dt>Feels Like</dt><dd>{forecast.feelsLike}</dd></div>
          <div><dt>Humidity</dt><dd>{forecast.humidity}</dd></div>
          <div><dt>Wind</dt><dd>{forecast.wind}</dd></div>
          <div><dt>Precipitation</dt><dd>{forecast.precipitaion}</dd></div>
        </dl>
        <section>
          <h2>Daily forecast</h2>
          <ul>
            {forecast.daily.map(item => (
              <li key={item.day}>
                <p>{item.day}</p>
                <p>{item.condition}</p>
                <p>{`Maximum of ${item.maximum}`}</p>
                <p>{`Minimum of ${item.minimum}`}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>Hourly forecast</h2>
          <select>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
            <option>Sunday</option>
          </select>
          <ul>
            {forecast.hourly.map(item => (
              <li key={item.hour}>
                <p>{item.hour}</p>
                <p>{item.condition}</p>
                <p>{item.temperature}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}

const initialForecast = {
  location: {
    city: "Berlin",
    country: "Germany",
  },
  date: "Tuesday, Aug 5, 2025",
  condition: "sunny",
  temperature: "20°",
  feelsLike: "18°",
  humidity: "46%",
  wind: "14km/h",
  precipitaion: "0mm",
  daily: [
    {
      day: "Tuesday",
      condition: "rain",
      maximum: "20°",
      minimum: "14°",
    },
    {
      day: "Wednesday",
      condition: "drizzle",
      maximum: "21°",
      minimum: "15°",
    }
  ],
  hourly: [
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
}

export default App
