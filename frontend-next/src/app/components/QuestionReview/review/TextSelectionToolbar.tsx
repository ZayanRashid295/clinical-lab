"use client";

import { forwardRef } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/shared/ui/button";

type Props = {
  x: number;
  y: number;
  onAddFeedback: () => void;
};

export const TextSelectionToolbar = forwardRef<HTMLDivElement, Props>(
  function TextSelectionToolbar({ x, y, onAddFeedback }, ref) {
    return (
      <div
        ref={ref}
        data-text-selection-toolbar
        className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
        style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          type="button"
          className="h-8 shadow-lg gap-1.5 rounded-full px-3"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddFeedback();
          }}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Add feedback
        </Button>
      </div>
    );
  }
);
