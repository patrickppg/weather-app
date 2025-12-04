import { useEffect } from "react"

function useMenuPattern(refComposite) {
  useEffect(() => {
    const composite = refComposite.current
    const trigger = composite.previousElementSibling
    const items = [...composite.querySelectorAll(":is([role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox'])")]

    trigger.setAttribute("aria-haspopup", "menu")
    items.forEach((item, i) => {
      item.setAttribute("tabindex", "-1")
      if (i === 0) item.setAttribute("autofocus", "")
    })

    composite.addEventListener("click", handleClick)
    composite.addEventListener("focusout", handleFocusOut)
    composite.addEventListener("keydown", handleKeyDown)
    trigger.addEventListener("mousedown", handleMouseDown)



    // Close the menu when a menuitem is activated
    function handleClick(e) {
      if (e.target.role === "menuitem") composite.hidePopover()
    }

  
  
    // Close the menu when it loses focus
    function handleFocusOut(e) {
      if (!e.currentTarget.contains(e.relatedTarget) && document.contains(e.relatedTarget)) composite.hidePopover()
    }



    // Implement keyboard interaction
    const handledKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", "Space", "Enter"]
    function handleKeyDown(e) {
      const key = e.code
      if (!handledKeys.includes(key)) return
      e.preventDefault()

      const currentItem = document.activeElement
      const firstItem = items[0]
      const lastItem = items.at(-1)
      const previousItem = currentItem === firstItem ? lastItem : items[items.indexOf(currentItem) - 1]
      const nextItem = currentItem === lastItem ? firstItem : items[items.indexOf(currentItem) + 1]
      let targetItem

      switch (key) {
        case "ArrowUp": targetItem = previousItem; break
        case "ArrowDown": targetItem = nextItem; break
        case "Home":
        case "PageUp": targetItem = firstItem; break
        case "End":
        case "PageDown": targetItem = lastItem; break
        case "Space": currentItem.click(); break
        case "Enter": currentItem.click(); composite.hidePopover()
      }

      if (targetItem) targetItem.focus()
    }



    // Prevent the menu from immediately reopening when its menu button is clicked while it is open
    function handleMouseDown(e) {
      if (e.currentTarget.nextElementSibling.matches(":popover-open")) e.preventDefault()
    }



    return () => {
      composite.removeEventListener("click", handleClick)
      composite.removeEventListener("focusout", handleFocusOut)
      composite.removeEventListener("keydown", handleKeyDown)
      trigger.removeEventListener("mousedown", handleMouseDown)
    }
  }, [refComposite])
}

export default useMenuPattern