import { ContentBlock } from "../rich-editor/types"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

/**
 * Helper function to convert markdown to HTML
 */
async function markdownToHTML(markdown: string): Promise<string> {
  try {
    if (!markdown || !markdown.trim()) {
      return "<p></p>"
    }
    
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdown)
    
    let html = String(file)
    
    // Remove any wrapping HTML/body tags if present (unified might add them)
    html = html.replace(/^<html[^>]*>/, '').replace(/<\/html>$/, '')
    html = html.replace(/^<body[^>]*>/, '').replace(/<\/body>$/, '')
    html = html.trim()
    
    // Ensure we have valid HTML
    if (!html || html === "") {
      html = `<p>${markdown.replace(/\n/g, '<br>')}</p>`
    }
    
    return html
  } catch (error) {
    console.error("Error converting markdown to HTML:", error)
    // Fallback: convert markdown to HTML manually
    let fallback = markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
    return `<p>${fallback}</p>`
  }
}

/**
 * Convert an array of ContentBlocks to a single HTML string
 * This concatenates all text block HTML content together
 * Note: This is a synchronous function. For proper markdown conversion, use blocksToHTMLAsync
 */
export function blocksToHTML(blocks: ContentBlock[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return "<p></p>"
  }

  // Filter to only text blocks and extract their HTML
  const textBlocks = blocks
    .filter((block) => block.type === "text")
    .map((block) => {
      // Get HTML from block data - prioritize html over markdown
      let html = block.data?.html || ""
      
      // Check if HTML is empty or just empty tags
      const isEmptyHtml = !html || 
        html.trim() === "" || 
        html.trim() === "<p></p>" || 
        html.trim() === "<p><br></p>" || 
        html.trim() === "<p> </p>" ||
        html.trim() === "<p><br/></p>" ||
        html.trim() === "<div></div>" ||
        html.trim() === "<div><br></div>"
      
      // If HTML is empty but we have markdown, use markdown as fallback
      // For synchronous conversion, we'll wrap markdown in paragraph tags
      // For proper markdown rendering, use blocksToHTMLAsync
      if (isEmptyHtml && block.data?.markdown) {
        const markdown = block.data.markdown
        // If markdown looks like HTML (starts with <), use it directly
        if (markdown.trim().startsWith("<")) {
          html = markdown
        } else {
          // For sync version, just wrap in paragraph - proper conversion requires async
          // This is a fallback - blocksToHTMLAsync should be used for proper markdown rendering
          html = `<p>${markdown}</p>`
        }
      }
      
      // If still no content, check for content field (legacy)
      if (!html && block.data?.content) {
        const content = block.data.content
        if (typeof content === "string") {
          if (content.trim().startsWith("<")) {
            html = content
          } else {
            html = `<p>${content}</p>`
          }
        }
      }
      
      return html.trim()
    })
    .filter((html) => html.length > 0)

  // If no text blocks found, return empty paragraph
  if (textBlocks.length === 0) {
    return "<p></p>"
  }

  // Join all HTML blocks together
  // TipTap can handle multiple block elements, so we can concatenate them
  return textBlocks.join("")
}

/**
 * Async version that properly converts markdown to HTML
 * Use this when blocks may contain markdown that needs to be rendered
 */
export async function blocksToHTMLAsync(blocks: ContentBlock[]): Promise<string> {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return "<p></p>"
  }

  // Filter to only text blocks and convert them
  const textBlockPromises = blocks
    .filter((block) => block.type === "text")
    .map(async (block) => {
      // Get HTML from block data - prioritize html over markdown
      let html = block.data?.html || ""
      const markdown = block.data?.markdown || ""
      
      // Check if HTML is empty or just empty tags
      const isEmptyHtml = !html || 
        html.trim() === "" || 
        html.trim() === "<p></p>" || 
        html.trim() === "<p><br></p>" || 
        html.trim() === "<p> </p>" ||
        html.trim() === "<p><br/></p>" ||
        html.trim() === "<div></div>" ||
        html.trim() === "<div><br></div>"
      
      // Check if HTML contains raw markdown syntax (like **bold**, *italic*, lists, etc.)
      // This happens when markdown was saved as HTML without conversion
      const htmlInnerText = html.replace(/<[^>]+>/g, '').trim()
      const markdownPatterns = [
        /\*\*[^*]+\*\*/,           // **bold**
        /\*[^*\n]+\*/,              // *italic*
        /^[-*+]\s/m,                // List items
        /^\d+\.\s/m,                // Numbered lists
        /^#{1,6}\s/m,               // Headers
      ]
      const containsMarkdownSyntax = !isEmptyHtml && markdownPatterns.some(pattern => 
        pattern.test(htmlInnerText) || pattern.test(html)
      )
      
      // If HTML is empty or contains markdown syntax, convert markdown to HTML
      if ((isEmptyHtml || containsMarkdownSyntax) && markdown) {
        // If markdown looks like HTML (starts with <), use it directly
        if (markdown.trim().startsWith("<")) {
          html = markdown
        } else {
          // Convert markdown to HTML properly
          html = await markdownToHTML(markdown)
        }
      } else if (isEmptyHtml && !markdown) {
        // If HTML is empty and no markdown, check for content field (legacy)
        if (block.data?.content) {
          const content = block.data.content
          if (typeof content === "string") {
            if (content.trim().startsWith("<")) {
              html = content
            } else {
              // Convert content as markdown if it's not HTML
              html = await markdownToHTML(content)
            }
          }
        }
      }
      
      return html.trim()
    })

  // Wait for all conversions to complete
  const textBlocks = await Promise.all(textBlockPromises)
  const filteredBlocks = textBlocks.filter((html) => html.length > 0)

  // If no text blocks found, return empty paragraph
  if (filteredBlocks.length === 0) {
    return "<p></p>"
  }

  // Join all HTML blocks together
  return filteredBlocks.join("")
}

/**
 * Convert an HTML string to an array of ContentBlocks
 * This creates a single text block with the HTML content
 * @param html - The HTML string to convert
 * @param existingBlocks - Optional existing blocks to preserve IDs and structure
 */
export function htmlToBlocks(html: string, existingBlocks?: ContentBlock[]): ContentBlock[] {
  if (!html || typeof html !== "string" || html.trim() === "") {
    // If we have existing blocks, preserve the first text block's ID
    const existingTextBlock = existingBlocks?.find(b => b.type === "text")
    return [
      {
        id: existingTextBlock?.id || `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "text",
        order: existingTextBlock?.order || 0,
        data: {
          html: "<p></p>",
          markdown: "",
        },
      },
    ]
  }

  // Clean up the HTML - ensure it's valid
  // IMPORTANT: Don't modify the HTML - preserve all inline styles (font-size, font-family, colors, etc.)
  let cleanedHtml = html.trim()

  // If the HTML doesn't start with a tag, wrap it in a paragraph
  if (!cleanedHtml.startsWith("<")) {
    cleanedHtml = `<p>${cleanedHtml}</p>`
  }

  // Preserve existing block ID if available (for consistency)
  const existingTextBlock = existingBlocks?.find(b => b.type === "text")
  const blockId = existingTextBlock?.id || `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const blockOrder = existingTextBlock?.order || 0

  // Debug: Log HTML to verify formatting is preserved
  if (process.env.NODE_ENV === "development" && (cleanedHtml.includes('style=') || cleanedHtml.includes('font-size') || cleanedHtml.includes('font-family'))) {
    console.log("htmlToBlocks: Preserving HTML with formatting:", cleanedHtml.substring(0, 200))
  }

  // Create a single text block with the HTML content
  // This preserves all formatting (bold, italic, font-size, font-family, colors, etc.)
  return [
    {
      id: blockId,
      type: "text",
      order: blockOrder,
      data: {
        html: cleanedHtml, // Preserve the full HTML with all inline styles
        markdown: "", // Markdown will be generated if needed, but HTML is the source of truth
      },
    },
  ]
}


