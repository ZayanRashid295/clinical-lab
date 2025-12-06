import { Extension } from "@tiptap/core"

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
              const fontSize = element.style.fontSize
              return fontSize ? fontSize.replace("px", "") : null
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              }
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

