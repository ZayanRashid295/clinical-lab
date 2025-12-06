import { Extension } from "@tiptap/core"

export const FontFamily = Extension.create({
  name: "fontFamily",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => {
              const fontFamily = element.style.fontFamily
              return fontFamily ? fontFamily.replace(/['"]+/g, "") : null
            },
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) {
                return {}
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontFamily }).run()
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontFamily: null }).removeEmptyTextStyle().run()
        },
    }
  },
})

