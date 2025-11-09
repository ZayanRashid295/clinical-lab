import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { interactive } from "../../utils/responsive";

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  error?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      error = false,
      size = "md",
      fullWidth = true,
      className = "",
      placeholder,
      children,
      ...props
    },
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
    appearance-none
    bg-white
    pr-10
  `;

    const borderClasses = error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500";

    return (
      <div className={`relative ${fullWidth ? "w-full" : "inline-block"}`}>
        <select
          ref={ref}
          className={`${baseClasses} ${borderClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={16}
        />
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
