import { useEffect } from "react"

function useComboboxPattern(refCombobox) {
  useEffect(() => {
    if (!refCombobox.current) return
    const combobox = refCombobox.current
    const listbox = document.getElementById(combobox.getAttribute("aria-controls"))

    combobox.setAttribute("aria-expanded", "false")
    listbox.setAttribute("tabindex", "-1")

    combobox.addEventListener("focus", handleComboboxFocus)
    combobox.addEventListener("keydown", handleComboboxKeyDown)
    combobox.addEventListener("blur", handleComboboxBlur)
    listbox.addEventListener("toggle", handleListboxToggle)
    listbox.addEventListener("click", handleOptionClick)
    listbox.addEventListener("mousedown", handleOptionMouseDown)



    function handleComboboxFocus() {
      if (listbox.querySelector("[role='option']")) {
        listbox.showPopover()
      }
    }



    const handledKeys = ["ArrowUp", "ArrowDown", "Home", "End", "Enter", "Escape"]
    function handleComboboxKeyDown(e) {
      if (!handledKeys.includes(e.code)) return

      if (e.code === "Enter") {
        if (combobox.ariaActiveDescendantElement) {
          e.preventDefault()
          combobox.ariaActiveDescendantElement.click()
        }
        return
      }

      if (e.code === "Escape") {
        if (listbox.matches(":popover-open")) {
          e.preventDefault()
          combobox.setAttribute("aria-expanded", "false")
          combobox.removeAttribute("aria-activedescendant")
          listbox.querySelector("[role='option'][data-active]")?.removeAttribute("data-active")
          listbox.hidePopover()
        } else combobox.value = ""
        return
      }

      e.preventDefault()

      const options = [...listbox.querySelectorAll("[role='option']")]
      const activeOption = combobox.ariaActiveDescendantElement
      const firstOption = options[0]
      const lastOption = options.at(-1)

      let previousOption, nextOption
      if (activeOption) {
        previousOption = activeOption === firstOption ? lastOption : options[options.indexOf(activeOption) - 1]
        nextOption = activeOption === lastOption ? firstOption : options[options.indexOf(activeOption) + 1]
      }
      else {
        previousOption = lastOption
        nextOption = firstOption
      }

      let targetOption
      switch (e.code) {
        case "ArrowUp": targetOption = previousOption; break
        case "ArrowDown": targetOption = nextOption; break
        case "Home": targetOption = firstOption; break
        case "End": targetOption = lastOption; break
      }

      combobox.setAttribute("aria-activedescendant", targetOption.id)
      targetOption.scrollIntoView({ block: "nearest", behavior: "instant" })
      targetOption.setAttribute("data-active", "")
      activeOption?.removeAttribute("data-active")
    }



    function handleComboboxBlur() {
      setTimeout(() => {
        if (document.hasFocus()) listbox.hidePopover()
      }, 0);
    }



    function handleListboxToggle(e) {
      if (e.newState === "open") {
        combobox.setAttribute("aria-expanded", "true")
        listbox.scrollTo({ top: 0, behavior: "instant" })
      }
      else if (e.newState === "closed") {
        combobox.setAttribute("aria-expanded", "false")
        combobox.removeAttribute("aria-activedescendant")
        listbox.querySelector("[role='option'][data-active]")?.removeAttribute("data-active")
      }
    }



    function handleOptionClick(e) {
      if (e.target.role !== "option") return

      combobox.value = e.target.innerText
      combobox.setAttribute("aria-expanded", "false")
      combobox.removeAttribute("aria-activedescendant")
      listbox.querySelector("[role='option'][data-active]")?.removeAttribute("data-active")
      listbox.hidePopover()
    }



    function handleOptionMouseDown(e) {
      e.preventDefault()
    }



    return () => {
      combobox.removeEventListener("keydown", handleComboboxKeyDown)
      combobox.removeAttribute("blur", handleComboboxBlur)
      listbox.removeEventListener("toggle", handleListboxToggle)
      listbox.removeEventListener("click", handleOptionClick)
      listbox.removeEventListener("mousedown", handleOptionMouseDown)
    }
  }, [refCombobox])
}

export default useComboboxPattern