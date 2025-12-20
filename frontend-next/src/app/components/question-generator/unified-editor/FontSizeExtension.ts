import { Extension } from "@tiptap/core"

function normalizeFontSize(fontSize: string | number) {
  const value = String(fontSize).replace("px", "").trim()
  return value.match(/^\d+$/) ? value : ""
}

// Simple, direct function to find font size class
function findFontSizeClass(element: HTMLElement): string | null {
  // Check element itself
  const classAttr = element.getAttribute("class") || element.className || ""
  if (typeof classAttr === "string") {
    const match = classAttr.match(/\btiptap-fs-(\d+)\b/)
    if (match?.[1]) return match[1]
  }
  
  // Check direct children (most common case)
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i] as HTMLElement
    const childClass = child.getAttribute("class") || child.className || ""
    if (typeof childClass === "string") {
      const match = childClass.match(/\btiptap-fs-(\d+)\b/)
      if (match?.[1]) return match[1]
    }
  }
  
  // Check parent (TipTap might wrap)
  let parent = element.parentElement
  let depth = 0
  while (parent && depth < 2) {
    const parentClass = parent.getAttribute("class") || parent.className || ""
    if (typeof parentClass === "string") {
      const match = parentClass.match(/\btiptap-fs-(\d+)\b/)
      if (match?.[1]) return match[1]
    }
    parent = parent.parentElement
    depth++
  }
  
  return null
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
              const el = element as HTMLElement
              
              // CRITICAL: When font size is the ONLY mark (no bold/italic), 
              // TipTap might not call parseHTML on the right element
              // So we need to be very thorough in finding the class
              
              // First, check the element itself
              const fontSize = findFontSizeClass(el)
              if (fontSize) {
                return fontSize
              }
              
              // Also check if this is a span with the class (common case)
              // TipTap might wrap text in spans, so check all spans in the tree
              if (el.tagName === 'SPAN' || el.tagName === 'span') {
                const classAttr = el.getAttribute("class") || el.className || ""
                if (typeof classAttr === "string") {
                  const match = classAttr.match(/\btiptap-fs-(\d+)\b/)
                  if (match?.[1]) return match[1]
                }
              }
              
              // Check all descendant spans (TipTap might nest)
              const descendantSpans = el.querySelectorAll('span[class*="tiptap-fs-"]')
              for (const span of Array.from(descendantSpans)) {
                const spanEl = span as HTMLElement
                const spanClass = spanEl.getAttribute("class") || ""
                const match = spanClass.match(/\btiptap-fs-(\d+)\b/)
                if (match?.[1]) return match[1]
              }
              
              // Fallback to inline style
              const styleAttr = el.getAttribute("style")
              if (styleAttr) {
                const match = styleAttr.match(/font-size\s*:\s*(\d+)px/i)
                if (match?.[1]) return match[1]
              }
              
              return null
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
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
