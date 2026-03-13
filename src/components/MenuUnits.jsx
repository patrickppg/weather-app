import { useId, useRef } from "react"
import { IconChevron, IconSettings } from "./Icons";
import useMenuPattern from "../hooks/useMenuPattern";

function MenuUnits({ units, onUnitsChange }) {
  const refMenu = useRef(null)

  useMenuPattern(refMenu)

  const idMenu = useId()
  const idLabelWind = useId()
  const idLabelTemperature = useId()
  const idLabelPrecipitation = useId()

  return (
    <>
      <button aria-controls={idMenu}>
        <IconSettings />Units<IconChevron className="icon-chevron" />
      </button>
      <div role="menu" id={idMenu} ref={refMenu}>
        <div role="menuitem" onClick={() => onUnitsChange("switch")}>
          {`Switch to ${units.all === "metric" ? "Imperial" : "Metric"}`}
        </div>
        <div role="group" aria-labelledby={idLabelTemperature}>
          <div id={idLabelTemperature}>Temperature</div>
          <div
            role="menuitemradio"
            className={units.temperature === "c" ? "checked" : null}
            onClick={() => onUnitsChange("celsius")}>
            Celsius
          </div>
          <div
            role="menuitemradio"
            className={units.temperature === "f" ? "checked" : null}
            onClick={() => onUnitsChange("fahrenheit")}>
            Fahrenheit
          </div>
        </div>
        <div role="separator" />
        <div role="group" aria-labelledby={idLabelWind}>
          <div id={idLabelWind}>Wind Speed</div>
          <div
            role="menuitemradio" 
            className={units.wind === "km/h" ? "checked" : null}
            aria-label="Kilometers per hour"
            onClick={() => onUnitsChange("kilometer")}>
            km/h
          </div>
          <div
            role="menuitemradio"
            className={units.wind === "mph" ? "checked" : null}
            aria-label="Miles per hour"
            onClick={() => onUnitsChange("mile")}>
            mph
          </div>
        </div>
        <div role="separator" />
        <div role="group" aria-labelledby={idLabelPrecipitation}>
          <div id={idLabelPrecipitation}>Precipitation</div>
          <div
            role="menuitemradio"
            className={units.precipitation === "mm" ? "checked" : null}
            onClick={() => onUnitsChange("millimeter")}>
            Millimeters
          </div>
          <div
            role="menuitemradio"
            className={units.precipitation === "in" ? "checked" : null}
            onClick={() => onUnitsChange("inch")}>
            Inches
          </div>
        </div>
      </div>
    </>
  )
}

export default MenuUnits