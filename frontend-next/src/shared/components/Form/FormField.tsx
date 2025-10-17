import React from "react";
import { typography, interactive, spacing } from "../../utils/responsive";

export interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  layout?: "vertical" | "horizontal";
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  hint,
  required = false,
  className = "",
  labelClassName = "",
  layout = "vertical",
}) => {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={`${
        isHorizontal ? "sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start" : ""
      } ${className}`}
    >
      {label && (
        <label
          className={`
          block ${typography.ui.regular} text-gray-700
          ${isHorizontal ? "sm:pt-2" : "mb-2"}
          ${labelClassName}
        `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={isHorizontal ? "sm:col-span-2" : ""}>
        {children}

        {hint && !error && (
          <p className={`${typography.caption.regular} mt-1`}>{hint}</p>
        )}

        {error && (
          <p className={`${typography.caption.regular} text-red-600 mt-1`}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormField;
