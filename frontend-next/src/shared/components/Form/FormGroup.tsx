import React from "react";
import { spacing } from "../../utils/responsive";

export interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: "xs" | "sm" | "md" | "lg";
  layout?: "vertical" | "horizontal" | "grid";
  columns?: 1 | 2 | 3 | 4;
}

const FormGroup: React.FC<FormGroupProps> = ({
  children,
  className = "",
  spacing: spacingSize = "md",
  layout = "vertical",
  columns = 2,
}) => {
  const spacingClasses = {
    xs: spacing.stack.xs,
    sm: spacing.stack.sm,
    md: spacing.stack.md,
    lg: spacing.stack.lg,
  };

  const layoutClasses = {
    vertical: spacingClasses[spacingSize],
    horizontal: "flex flex-col sm:flex-row gap-4 sm:gap-6 items-start",
    grid: `grid grid-cols-1 ${columns === 2 ? "sm:grid-cols-2" : ""} ${
      columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : ""
    } ${columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : ""} gap-4 sm:gap-6`,
  };

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>{children}</div>
  );
};

export default FormGroup;
