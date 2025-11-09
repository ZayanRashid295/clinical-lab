import React from "react";
import Modal, { ModalProps } from "./Modal";
import { typography, spacing, interactive } from "../../utils/responsive";

export interface FormModalProps extends Omit<ModalProps, "children"> {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  showActions?: boolean;
  loading?: boolean;
  submitDisabled?: boolean;
  footerActions?: React.ReactNode;
}

const FormModal: React.FC<FormModalProps> = ({
  children,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  showActions = true,
  loading = false,
  submitDisabled = false,
  footerActions,
  onClose,
  ...modalProps
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !loading && !submitDisabled) {
      onSubmit(e);
    }
  };

  return (
    <Modal
      onClose={onClose}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      {...modalProps}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Form Content */}
        <div className={`flex-1 overflow-y-auto ${spacing.component.sm}`}>
          {children}
        </div>

        {/* Actions */}
        {(showActions || footerActions) && (
          <div
            className={`border-t border-gray-200 ${spacing.component.sm} bg-gray-50 rounded-b-lg`}
          >
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
              {footerActions && <div className="flex-1">{footerActions}</div>}

              {showActions && (
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className={`${interactive.button.md} border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || submitDisabled}
                    className={`${interactive.button.md} bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {submitText}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default FormModal;
