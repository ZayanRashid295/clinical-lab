import React, { useEffect } from "react";
import {
  X,
  HelpCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Hash,
} from "lucide-react";
import { QuestionPaperQuestion } from "../../types/question-paper-question";

interface QuestionPaperQuestionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionPaperQuestion: QuestionPaperQuestion | null;
}

export default function QuestionPaperQuestionViewModal({
  isOpen,
  onClose,
  questionPaperQuestion,
}: QuestionPaperQuestionViewModalProps) {
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeSpent = (seconds?: number) => {
    if (!seconds) return "Not recorded";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  if (!isOpen || !questionPaperQuestion) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <HelpCircle className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Question Paper Question Details
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
              <HelpCircle className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                Order: {questionPaperQuestion.order}
              </h3>
              {questionPaperQuestion.questionPaper && (
                <p className="text-gray-600 mt-1">
                  {questionPaperQuestion.questionPaper.name}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Question Information
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Order</p>
                  <div className="flex items-center mt-1">
                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">
                      {questionPaperQuestion.order}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Question Paper
                  </p>
                  <div className="flex items-center mt-1">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-gray-900">
                      {questionPaperQuestion.questionPaper?.name || "N/A"}
                    </p>
                    {questionPaperQuestion.questionPaper?.type && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {questionPaperQuestion.questionPaper.type}
                      </span>
                    )}
                  </div>
                </div>

                {questionPaperQuestion.question && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Question Text
                      </p>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                        {questionPaperQuestion.question.text || "N/A"}
                      </p>
                    </div>

                    {questionPaperQuestion.question.explanation && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Explanation
                        </p>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                          {questionPaperQuestion.question.explanation}
                        </p>
                      </div>
                    )}

                    {questionPaperQuestion.question.choices &&
                      questionPaperQuestion.question.choices.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            Choices
                          </p>
                          <div className="space-y-2">
                            {questionPaperQuestion.question.choices.map(
                              (choice) => (
                                <div
                                  key={choice.id}
                                  className={`p-2 rounded border ${
                                    choice.isCorrect
                                      ? "bg-green-50 border-green-200"
                                      : "bg-gray-50 border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-900">
                                      {choice.text}
                                    </span>
                                    {choice.isCorrect && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Answer & Performance
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    User Answer
                  </p>
                  <p className="text-gray-900 mt-1">
                    {questionPaperQuestion.userAnswer || (
                      <span className="text-gray-400">Not answered</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center">
                  {questionPaperQuestion.isCorrect !== undefined &&
                  questionPaperQuestion.isCorrect !== null ? (
                    questionPaperQuestion.isCorrect ? (
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
                    )
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Correct
                      </p>
                      <p className="text-gray-400">Not evaluated</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Time Spent
                    </p>
                    <p className="text-gray-900">
                      {formatTimeSpent(questionPaperQuestion.timeSpent)}
                    </p>
                  </div>
                </div>
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
                      {formatDate(questionPaperQuestion.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Last Updated
                    </p>
                    <p className="text-gray-900">
                      {formatDateTime(questionPaperQuestion.updatedAt)}
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

