import React, { useEffect } from "react";
import {
  X,
  Circle,
  Calendar,
  CheckCircle,
  XCircle,
  Hash,
  HelpCircle,
} from "lucide-react";
import { QuestionChoice } from "../../types/question";

interface QuestionChoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionChoice: QuestionChoice | null;
}

export default function QuestionChoiceViewModal({
  isOpen,
  onClose,
  questionChoice,
}: QuestionChoiceViewModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!isOpen || !questionChoice) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Circle className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Question Choice Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
              <Circle className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                Choice {String.fromCharCode(65 + questionChoice.order)}
              </h3>
              <p className="text-gray-600 mt-1">{questionChoice.text}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Choice Information
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Text</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                    {questionChoice.text}
                  </p>
                </div>

                <div className="flex items-center">
                  {questionChoice.isCorrect ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Correct
                        </p>
                        <p className="text-green-700 font-semibold">Yes</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Correct
                        </p>
                        <p className="text-red-700 font-semibold">No</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center">
                  <Hash className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order</p>
                    <p className="text-gray-900">
                      {questionChoice.order} ({String.fromCharCode(65 + questionChoice.order)})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Question Information
              </h4>

              <div className="space-y-3">
                {questionChoice.question && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Question Text
                      </p>
                      <div className="flex items-center mt-1">
                        <HelpCircle className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-gray-900 text-sm">
                          {questionChoice.question.question}
                        </p>
                      </div>
                    </div>

                    {questionChoice.question.topic && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Topic</p>
                        <p className="text-gray-900">
                          {questionChoice.question.topic.name}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mt-6">
                Metadata
              </h4>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Created At
                    </p>
                    <p className="text-gray-900">
                      {formatDate(questionChoice.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

