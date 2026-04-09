import React from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import Modal from "./Modal";
import { typography, spacing, interactive } from "../../utils/responsive";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  loading = false,
}) => {
  const getVariantConfig = () => {
    const configs = {
      danger: {
        icon: X,
        iconColor: "text-red-600",
        iconBg: "bg-red-100",
        confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      },
      warning: {
        icon: AlertTriangle,
        iconColor: "text-yellow-600",
        iconBg: "bg-yellow-100",
        confirmButton:
          "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      },
      info: {
        icon: Check,
        iconColor: "text-blue-600",
        iconBg: "bg-blue-100",
        confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      },
    };
    return configs[variant];
  };

  const config = getVariantConfig();
  const IconComponent = config.icon;

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className={spacing.component.md}>
        {/* Icon and Content */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Icon */}
          <div
            className={`flex-shrink-0 mx-auto sm:mx-0 w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center`}
          >
            <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 text-center sm:text-left relative">
            <div className="flex items-start justify-between">
              <h3 className={`${typography.heading[4]} text-gray-900 mb-2 pr-8`}>
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1 -mr-1 -mt-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p className={`${typography.body.regular} text-gray-600 mb-6`}>
              {message}
            </p>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={onClose}
                disabled={loading}
                className={`${interactive.button.md} border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`${interactive.button.md} ${config.confirmButton} text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
