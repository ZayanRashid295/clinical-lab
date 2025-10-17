import React, { forwardRef } from "react";
import { interactive } from "../../utils/responsive";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { error = false, size = "md", fullWidth = true, className = "", ...props },
    ref
  ) => {
    const sizeClasses = {
      sm: interactive.input.sm,
      md: interactive.input.md,
      lg: interactive.input.lg,
    };

    const baseClasses = `
    ${sizeClasses[size]}
    ${fullWidth ? "w-full" : ""}
    border rounded-md
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-colors
  `;

    const borderClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500";

    return (
      <input
        ref={ref}
        className={`${baseClasses} ${borderClasses} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
