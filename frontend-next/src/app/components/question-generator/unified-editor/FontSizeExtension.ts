import { Extension } from "@tiptap/core"

function normalizeFontSize(fontSize: string | number) {
  const value = String(fontSize).replace("px", "").trim()
  return value.match(/^\d+$/) ? value : ""
}

function parseFontSizeFromClassName(element: HTMLElement) {
  // We store font size as class `tiptap-fs-12` etc.
  const className = element.getAttribute("class") || ""
  const match = className.match(/\btiptap-fs-(\d+)\b/)
  return match?.[1] || null
}

export const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => {
              // Prefer our class-based representation, fallback to legacy inline styles.
              const fromClass = parseFontSizeFromClassName(element as HTMLElement)
              if (fromClass) return fromClass
              const fontSize = (element as HTMLElement).style.fontSize
              return fontSize ? fontSize.replace("px", "") : null
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
              // Use a class instead of inline style to avoid clobbering other `style`
              // attributes like `color` and `font-family` on the same `textStyle` mark.
              const size = normalizeFontSize(attributes.fontSize)
              return size ? { class: `tiptap-fs-${size}` } : {}
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          // Store just the number (without "px") - renderHTML will add "px"
          // Also handle if "px" is already included
          const sizeValue = fontSize.replace("px", "").trim()
          return chain().setMark("textStyle", { fontSize: sizeValue }).run()
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run()
        },
    }
  },
})

