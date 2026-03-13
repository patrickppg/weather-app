import { useEffect, useLayoutEffect, useRef } from "react"

function useMenuPattern(refMenu) {
  const refMenuitems = useRef(null)
  
  useLayoutEffect(() => {
    if (!refMenu.current) return
    const menu = refMenu.current
    const menuButton = document.querySelector(`[aria-controls="${menu.id}"]`)
    const menuitems = [...menu.querySelectorAll(":is([role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox'])")]
    refMenuitems.current = menuitems

    menuButton.setAttribute("popovertarget", menu.id)
    menuButton.setAttribute("aria-haspopup", "menu")
    menu.setAttribute("popover", "auto")
    menuitems.forEach((item, i) => {
      item.setAttribute("tabindex", "-1")
      if (i === 0) item.setAttribute("autofocus", "")
    })

    menu.addEventListener("click", handleClick)
    menu.addEventListener("focusout", handleFocusOut)
    menu.addEventListener("keydown", handleKeyDown)
    menuButton.addEventListener("mousedown", handleMouseDown)



    function handleClick(e) {
      switch (e.target.role) {
        case "menuitem": menu.hidePopover(); break
        case "menuitemradio": checkRadioInGroup(e.target); break
        case "menuitemcheckbox": e.target.setAttribute("aria-checked", e.target.ariaChecked === "true" ? "false" : "true")
      }
    }

  
  
    function handleFocusOut(e) {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setTimeout(() => {
          if (document.hasFocus()) menu.hidePopover()
        }, 0);
      }
    }



    const handledKeys = ["ArrowUp", "ArrowDown", "Home", "End", "Space", "Enter"]
    function handleKeyDown(e) {
      if (!handledKeys.includes(e.code)) return
      e.preventDefault()

      const focusedItem = document.activeElement
      const firstItem = menuitems[0]
      const lastItem = menuitems.at(-1)
      const previousItem = focusedItem === firstItem ? lastItem : menuitems[menuitems.indexOf(focusedItem) - 1]
      const nextItem = focusedItem === lastItem ? firstItem : menuitems[menuitems.indexOf(focusedItem) + 1]
      let targetItem

      switch (e.code) {
        case "ArrowUp": targetItem = previousItem; break
        case "ArrowDown": targetItem = nextItem; break
        case "Home": targetItem = firstItem; break
        case "End": targetItem = lastItem; break
        case "Space": focusedItem.click(); break
        case "Enter": focusedItem.click(); menu.hidePopover()
      }

      if (targetItem) targetItem.focus()
    }



    function handleMouseDown(e) {
      if (menu.matches(":popover-open")) e.preventDefault()
    }



    return () => {
      menu.removeEventListener("click", handleClick)
      menu.removeEventListener("focusout", handleFocusOut)
      menu.removeEventListener("keydown", handleKeyDown)
      menuButton.removeEventListener("mousedown", handleMouseDown)
    }
  }, [refMenu])



  useEffect(() => {
    if (!refMenuitems.current) return
    refMenuitems.current.forEach((item) => {
      if (item.role === "menuitemradio" || item.role === "menuitemcheckbox") {
        if (item.classList.contains("checked")) {
          item.setAttribute("aria-checked", "true")
        } else item.setAttribute("aria-checked", "false")
      }
    })
  })
}



function checkRadioInGroup(activatedRadio) {
  const group =
    activatedRadio.closest("[role='menu'] [role='group']") ||
    activatedRadio.closest("[role='menu']")
  const checkedRadio = group.querySelector("[aria-checked='true']")

  if (checkedRadio) checkedRadio.setAttribute("aria-checked", "false")
  activatedRadio.setAttribute("aria-checked", "true")
}

export default useMenuPattern