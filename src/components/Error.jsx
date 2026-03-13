import { useLayoutEffect, useRef } from "react"
import { IconRetry } from "./Icons"

function Error({ hidden, onRetry }) {
  const refErrorSummary = useRef(null)

  useLayoutEffect(() => {
    if (!hidden) refErrorSummary.current.focus()
  }, [hidden])

  return (
    <div id="error" hidden={hidden}>
      <p ref={refErrorSummary} tabIndex="-1"><strong>Something went wrong</strong></p>
      <p>We couldn't connect to the server. Please try again in a few moments.</p>
      <button
        onClick={() => onRetry()}
        onMouseDown={e => e.preventDefault()}>
        <IconRetry />Retry
      </button>
    </div>
  )
}

export default Error