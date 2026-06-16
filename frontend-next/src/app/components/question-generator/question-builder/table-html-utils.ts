/** TipTap table cells must allow lists — otherwise `<ul>` inside `<td>` is misparsed as extra columns. */
export const TIPTAP_TABLE_CELL_CONTENT = "(paragraph | bulletList | orderedList)+";

function wrapCellBlockContent(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "<p></p>";
  if (/^<(p|ul|ol|h[1-6]|div|blockquote)\b/i.test(trimmed)) return trimmed;
  return `<p>${trimmed}</p>`;
}

/** Ensure each body row has exactly `colCount` cells and block-level cell content. */
export function normalizeTableHtmlForEditor(html: string, colCount?: number): string {
  if (!html?.includes("<table")) return html;
  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  if (!table) return html;

  const headerCells = table.querySelectorAll("thead tr > th, thead tr > td");
  const resolvedColCount =
    colCount ?? headerCells.length ?? table.querySelector("tr")?.children.length ?? 3;

  const rows = table.querySelectorAll("tbody tr");
  const bodyRows = rows.length > 0 ? Array.from(rows) : Array.from(table.querySelectorAll("tr")).slice(1);

  for (const row of bodyRows) {
    let cells = Array.from(row.querySelectorAll(":scope > th, :scope > td"));

    if (cells.length > resolvedColCount) {
      const keep = cells.slice(0, resolvedColCount);
      const overflow = cells.slice(resolvedColCount);
      const target = keep[resolvedColCount - 1];
      for (const extra of overflow) {
        if (extra.innerHTML.trim()) {
          target.innerHTML = `${target.innerHTML}${extra.innerHTML}`;
        }
        extra.remove();
      }
      cells = keep;
    }

    while (cells.length < resolvedColCount) {
      const td = doc.createElement("td");
      td.innerHTML = "<p></p>";
      row.appendChild(td);
      cells.push(td);
    }

    for (const cell of cells) {
      cell.innerHTML = wrapCellBlockContent(cell.innerHTML);
    }
  }

  const headerRow = table.querySelector("thead tr");
  if (headerRow) {
    for (const cell of Array.from(headerRow.querySelectorAll(":scope > th, :scope > td"))) {
      cell.innerHTML = wrapCellBlockContent(cell.innerHTML);
    }
  }

  return table.outerHTML;
}

export function buildTableHtmlFromRows(
  headers: string[],
  rows: Array<{ text: string[]; html?: string[] }>,
): string {
  const colCount = headers.length;
  const headerCells = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const bodyRows = rows
    .map((row) => {
      const cells = Array.from({ length: colCount }, (_, index) => {
        const cellHtml = row.html?.[index]?.trim();
        const cellText = row.text[index] ?? "";
        const inner = cellHtml || formatPlainCellContent(cellText);
        return `<td>${wrapCellBlockContent(inner)}</td>`;
      });
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  const html = `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  return normalizeTableHtmlForEditor(html, colCount);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPlainCellContent(text: string): string {
  if (!text) return "<p></p>";
  const withBullets = text.replace(/•\s*/g, "\n• ").trim();
  return escapeHtml(withBullets).replace(/\n/g, "<br>");
}
