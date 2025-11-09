import React, { useEffect } from "react";
import { X } from "lucide-react";
import { typography, spacing, interactive } from "../../utils/responsive";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = "",
  headerActions,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getSizeClasses = () => {
    const sizeMap = {
      sm: "max-w-sm",
      md: "max-w-md sm:max-w-lg",
      lg: "max-w-lg sm:max-w-xl lg:max-w-2xl",
      xl: "max-w-xl sm:max-w-2xl lg:max-w-4xl",
      full: "max-w-full",
    };

    const heightMap = {
      sm: "max-h-[80vh]",
      md: "max-h-[85vh]",
      lg: "max-h-[90vh]",
      xl: "max-h-[90vh]",
      full: "max-h-[95vh]",
    };

    return `${sizeMap[size]} ${heightMap[size]}`;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={`
            relative w-full ${getSizeClasses()}
            bg-white rounded-lg shadow-xl
            transform transition-all duration-200
            ${className}
          `}
        >
          {/* Header */}
          {(title || showCloseButton || headerActions) && (
            <div
              className={`flex items-center justify-between ${spacing.component.sm} border-b border-gray-200`}
            >
              <div className="flex-1 min-w-0">
                {title && (
                  <h2
                    className={`${typography.heading[3]} text-gray-900 truncate`}
                  >
                    {title}
                  </h2>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {headerActions}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={`${interactive.touch.sm} flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors`}
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
