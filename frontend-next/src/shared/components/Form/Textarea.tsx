import React, { forwardRef } from "react";
import { interactive } from "../../utils/responsive";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      error = false,
      size = "md",
      fullWidth = true,
      resize = "vertical",
      className = "",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: interactive.input.sm,
      md: interactive.input.md,
      lg: interactive.input.lg,
    };

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    const baseClasses = `
    ${sizeClasses[size]}
    ${fullWidth ? "w-full" : ""}
    ${resizeClasses[resize]}
    border rounded-md
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-colors
    min-h-[80px]
  `;

    const borderClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500";

    return (
      <textarea
        ref={ref}
        className={`${baseClasses} ${borderClasses} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
