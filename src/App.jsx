import { useState } from 'react'
import './App.css'

function App() {
  const [forecast, setForecast] = useState(initialForecast)
  
  return (
    <>
      <header id="banner">
        <img src="/images/logo.svg" alt="Weather Now app" />
        <button id="menu-units">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M14.125 7.406c.031.407.031.813 0 1.188l1 .594a.74.74 0 0 1 .344.843c-.344 1.313-1.063 2.5-2 3.469-.25.219-.625.281-.906.125l-1-.594c-.25.188-.72.469-1.032.594v1.156a.733.733 0 0 1-.562.719A7.765 7.765 0 0 1 6 15.5c-.313-.063-.563-.406-.563-.719v-1.156a5.54 5.54 0 0 1-1.03-.594l-1 .594c-.282.156-.657.094-.907-.125-.938-.969-1.656-2.156-2-3.469a.74.74 0 0 1 .344-.844l1-.593c-.032-.156-.032-.406-.032-.594 0-.156 0-.406.032-.594l-1-.562A.74.74 0 0 1 .5 6c.344-1.313 1.063-2.5 2-3.469.25-.219.625-.281.906-.125l1 .594c.25-.188.719-.469 1.032-.594V1.25c0-.344.218-.625.562-.719a7.766 7.766 0 0 1 3.969 0c.312.063.562.406.562.719v1.156c.313.125.781.406 1.031.594l1-.594c.282-.156.657-.094.907.125.937.969 1.656 2.156 2 3.469a.74.74 0 0 1-.344.844l-1 .562Zm-1.656 2c.25-1.312.25-1.469 0-2.781l1.375-.781c-.188-.563-.688-1.375-1.063-1.813l-1.375.782c-.969-.844-1.125-.938-2.375-1.375V1.843C8.75 1.812 8.281 1.75 8 1.75c-.313 0-.781.063-1.063.094v1.593c-1.25.438-1.375.532-2.375 1.376L3.188 4.03c-.468.532-.812 1.157-1.062 1.813l1.375.781c-.25 1.313-.25 1.469 0 2.781l-1.375.781c.188.563.688 1.376 1.063 1.813l1.374-.781c.97.844 1.125.937 2.375 1.375v1.594c.282.03.75.093 1.063.093.281 0 .75-.062 1.031-.094v-1.593c1.25-.438 1.375-.531 2.375-1.375l1.375.781c.375-.438.875-1.25 1.063-1.813l-1.375-.78ZM8 5c1.625 0 3 1.375 3 3 0 1.656-1.375 3-3 3a3 3 0 0 1-3-3c0-1.625 1.344-3 3-3Zm0 4.5A1.5 1.5 0 0 0 9.5 8c0-.813-.688-1.5-1.5-1.5A1.5 1.5 0 0 0 6.5 8c0 .844.656 1.5 1.5 1.5Z"/></svg>
          Units
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8"><path d="M6.309 7.484 1.105 2.316c-.175-.14-.175-.421 0-.597l.704-.668a.405.405 0 0 1 .597 0l4.219 4.148 4.184-4.148c.175-.176.457-.176.597 0l.703.668c.176.176.176.457 0 .597L6.906 7.484a.405.405 0 0 1-.597 0Z"/></svg>  
        </button>
      </header>
      <main>
        <header id="search">
          <h1>How's the sky looking today?</h1>
          <search>
            <form className="contents" action="get">
              <div>
                <input type="search" placeholder="Search for a place..." aria-label="Location" />
              </div>
              <button type="submit">Search</button>
            </form>
          </search>
        </header>
        <div id="forecast-overview">
          <p className="location">{`${forecast.location.city}, ${forecast.location.country}`}</p>
          <p className="date">{forecast.date}</p>
          <p className="condition"><img src="/images/icon-sunny.webp" alt="Sunny" /></p>
          <p className="temperature">{forecast.temperature}</p>
        </div>
        <dl id="forecast-details" aria-description="forecast details">
          <div><dt>Feels Like</dt><dd>{forecast.feelsLike}</dd></div>
          <div><dt>Humidity</dt><dd>{forecast.humidity}</dd></div>
          <div><dt>Wind</dt><dd>{forecast.wind}</dd></div>
          <div><dt>Precipitation</dt><dd>{forecast.precipitaion}</dd></div>
        </dl>
        <section id="forecast-daily">
          <h2>Daily forecast</h2>
          <ul>
            {forecast.daily.map(item => (
              <li className="daily-forecast" key={item.day}>
                <p className="day">{item.day}</p>
                <p className="icon"><img src="/images/icon-sunny.webp" alt="Sunny" /></p>
                <p className="maximum"><span className="visually-hidden">Maximum of </span>{item.maximum}</p>
                <p className="minimum"><span className="visually-hidden">Minimum of </span>{item.minimum}</p>
              </li>
            ))}
          </ul>
        </section>
        <section id="forecast-hourly">
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
              <li className="hourly-forecast" key={item.hour}>
                <p className="hour">{item.hour}</p>
                <p className="icon"><img src="/images/icon-sunny.webp" alt="Sunny" /></p>
                <p className="temperature">{item.temperature}</p>
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
