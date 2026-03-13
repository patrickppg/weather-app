import { useEffect, useId, useImperativeHandle, useRef, useState } from "react"
import { IconClear, IconSearch } from "./Icons"
import useComboboxPattern from "../hooks/useComboboxPattern"

function Search({ status, ref, onSearch }) {
  const [suggestions, setSuggestions] = useState(null)

  const refForm = useRef(null)
  const refCombobox = useRef(null)
  const refListbox = useRef(null)
  const refSearchTimer = useRef(null)
  const refController = useRef(null)



  function handleSubmit(e) {
    e.preventDefault()
    refController.current?.abort()
    clearTimeout(refSearchTimer.current)

    const searchInput = e.target.elements["location"].value.trim()
    if (searchInput) {
      onSearch(searchInput)
      setSuggestions(null)
    }
  }



  function handleChange(e) {
    refController.current?.abort()
    clearTimeout(refSearchTimer.current)
    
    if (e.target.value.length < 3) {
      setSuggestions(null)
      return
    }

    const controller = new AbortController()
    refController.current = controller

    refSearchTimer.current = setTimeout(async () => {
      try {
        setSuggestions(await getSuggestions({
          query: e.target.value,
          signal: controller.signal
        }))
      } catch {
        setSuggestions(null)
      }
    }, 500);
  }



  function handleKeyDown(e) {
    if (e.code !== "Escape") return
    if (!refListbox.current.matches(":popover-open")) return
    setSuggestions(null)
  }



  function handleClick() {
    refCombobox.current.value = ""
    refCombobox.current.focus()
    setSuggestions(null)
  }



  useEffect(() => {
    if (suggestions) {
      if (document.activeElement === refCombobox.current) {
        refListbox.current.showPopover()
      }
    }
    else refListbox.current.hidePopover()
  }, [suggestions])



  useEffect(() => {
    if (status !== "error") return
    refForm.current.reset()
  }, [status])



  useImperativeHandle(ref, () => {
    return {
      focusSearchField() {
        refCombobox.current.focus()
      }
    }
  })



  useComboboxPattern(refCombobox)

  const idSearchLable = useId()
  
  return (
    <search id="search" hidden={status === "error"} aria-labelledby={idSearchLable}>
      <div id={idSearchLable} className="title">How's the sky looking today?</div>
      <form ref={refForm} onSubmit={handleSubmit}>
        <IconSearch className="icon-search" />
        <input
          type="text"
          name="location"
          placeholder="Search for a place"
          autoComplete="off"
          spellCheck="false"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="listbox-suggestions"
          aria-haspopup="listbox"
          ref={refCombobox}
          onChange={handleChange}
          onKeyDown={handleKeyDown} />
        <div
          role="listbox"
          id="listbox-suggestions"
          aria-label="Suggestions"
          popover="manual"
          ref={refListbox}>
          {suggestions?.map(suggestion => (
            <div
              role="option"
              id={suggestion.id}
              key={suggestion.id}>
              {suggestion.name}
            </div>
          ))}
        </div>
        <button
          className="clear"
          type="button"
          aria-label="Clear Search"
          onClick={handleClick}
          onMouseDown={e => e.preventDefault()}>
          <IconClear />
        </button>
        <button type="submit">Search</button>
      </form>
    </search>
  )
}

export default Search



async function getSuggestions({ query, signal }) {
  const parts = query
    .split(",")
    .map(part => part.trim().toLowerCase())

  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${parts[0]}&count=10`, { signal })
  const data = await res.json()

  if (!data.results || !res.ok) return null

  let suggestions
  switch (parts.length) {
    case 1:
      suggestions = data.results
      break
    case 2:
      suggestions = data?.results.filter(res => res.name.toLowerCase() === parts[0] && res.admin1.toLowerCase() === parts[1])
      if (!suggestions?.length) {
        suggestions = data?.results.filter(res => res.name.toLowerCase() === parts[0] && res.country.toLowerCase() === parts[1])
      }
      break
    case 3:
      suggestions = data?.results.filter(res => (
        res.name.toLowerCase() === parts[0] &&
        res.admin1.toLowerCase() === parts[1] &&
        res.country.toLowerCase() === parts[2]
      ))
  }

  if (!suggestions?.length) return null

  return suggestions
    .filter(suggestion => suggestion.admin1 && suggestion.country)
    .map(suggestion => {
      const admin = (suggestion.admin1 === suggestion.name || suggestion.admin1.includes(suggestion.name)) ? null : suggestion.admin1

      return {
        id: String(suggestion.id),
        name: `${suggestion.name}, ` + `${admin ? admin + ", " : ""}` + `${suggestion.country}`,
      }
    })
}
