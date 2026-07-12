"use client";

import { useMemo } from "react";
import { useReviewContext } from "./ReviewContext";
import { anchorYFromEvent } from "./review-panel-position";
import { CommentBadge } from "./CommentBadge";

type Props = {
  tableId: string;
  tableHtml: string;
};

function extractRows(html: string): string[][] {
  if (typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll("tr"));
  return rows.map((tr) =>
    Array.from(tr.querySelectorAll("th, td")).map(
      (cell) => cell.textContent?.trim() ?? ""
    )
  );
}

export function ReviewableTable({ tableId, tableHtml }: Props) {
  const { openDrawer, countForTarget } = useReviewContext();
  const rows = useMemo(() => extractRows(tableHtml), [tableHtml]);

  return (
    <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
      <table className="w-full text-sm border-collapse">
        <tbody>
          {rows.map((cells, rowIndex) => {
            const rowKey = `table:${tableId}:row:${rowIndex}`;
            const rowCount = countForTarget(rowKey);
            return (
              <tr
                key={rowIndex}
                className="group border-b last:border-0 dark:border-slate-700 hover:bg-muted/30 dark:hover:bg-slate-800/40"
              >
                {cells.map((cell, cellIndex) => {
                  const cellKey = `table:${tableId}:cell:${rowIndex}:${cellIndex}`;
                  const cellCount = countForTarget(cellKey);
                  return (
                    <td
                      key={cellIndex}
                      className="relative px-3 py-2 align-top text-slate-800 dark:text-slate-200"
                    >
                      {cell}
                      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <CommentBadge count={cellCount} />
                        <button
                          type="button"
                          className="text-[10px] text-primary px-1 rounded"
                          onClick={(e) =>
                            openDrawer({
                              targetType: "TABLE_CELL",
                              targetKey: cellKey,
                              section: `Table row ${rowIndex + 1}, cell ${cellIndex + 1}`,
                              preview: cell,
                              anchorY: anchorYFromEvent(e),
                            })
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                  );
                })}
                <td className="w-16 px-2 align-top">
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-primary flex items-center gap-1"
                    onClick={(e) =>
                      openDrawer({
                        targetType: "TABLE_ROW",
                        targetKey: rowKey,
                        section: `Table row ${rowIndex + 1}`,
                        preview: cells.join(" | "),
                        anchorY: anchorYFromEvent(e),
                      })
                    }
                  >
                    <CommentBadge count={rowCount} />
                    Row
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
