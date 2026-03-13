import MenuUnits from "./MenuUnits"

function Banner({ units, inert, onUnitsChange }) {
  return (
    <header id="banner" inert={inert}>
      <img className="logo" src="/images/logo.svg" alt="The Weather Now app" />
      <MenuUnits units={units} onUnitsChange={onUnitsChange} />
    </header>
  )
}

export default Banner