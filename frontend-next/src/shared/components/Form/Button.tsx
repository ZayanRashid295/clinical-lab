import React from "react";
import { interactive } from "../../utils/responsive";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: interactive.button.sm,
    md: interactive.button.md,
    lg: interactive.button.lg,
  };

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    ghost:
      "bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300 focus:ring-gray-500",
  };

  const baseClasses = `
    ${sizeClasses[size]}
    ${fullWidth ? "w-full" : ""}
    ${variantClasses[variant]}
    rounded-md font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
    flex items-center justify-center gap-2
    ${interactive.touch.md}
  `;

  const isDisabled = disabled || loading;

  return (
    <button
      className={`${baseClasses} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
