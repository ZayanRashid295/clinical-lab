import React, { useEffect } from "react";
import {
  X,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Hash,
} from "lucide-react";
import { QuestionPaper } from "../../types/assessment";

interface QuestionPaperViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionPaper: QuestionPaper | null;
}

export default function QuestionPaperViewModal({
  isOpen,
  onClose,
  questionPaper,
}: QuestionPaperViewModalProps) {
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

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      practice: "bg-blue-100 text-blue-800",
      mock: "bg-purple-100 text-purple-800",
      assessment: "bg-green-100 text-green-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  if (!isOpen || !questionPaper) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Question Paper Details
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
              <FileText className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {questionPaper.name}
              </h3>
              {questionPaper.description && (
                <p className="text-gray-600 mt-1">{questionPaper.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {getStatusIcon(questionPaper.isActive)}
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    questionPaper.isActive
                  )}`}
                >
                  {questionPaper.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                    questionPaper.type
                  )}`}
                >
                  {questionPaper.type}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Question Paper Information
              </h4>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{questionPaper.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Description
                  </p>
                  <p className="text-gray-900">
                    {questionPaper.description || "No description provided"}
                  </p>
                </div>

                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">User</p>
                    <p className="text-gray-900">
                      {questionPaper.user
                        ? `${questionPaper.user.firstName} ${questionPaper.user.lastName}`
                        : "N/A"}
                    </p>
                    {questionPaper.user?.email && (
                      <p className="text-sm text-gray-500">
                        {questionPaper.user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                      questionPaper.type
                    )}`}
                  >
                    {questionPaper.type}
                  </span>
                </div>

                <div className="flex items-center">
                  <Hash className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Questions
                    </p>
                    <p className="text-gray-900">
                      {questionPaper.totalQuestions}
                    </p>
                  </div>
                </div>

                {questionPaper.timeLimit && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Time Limit
                      </p>
                      <p className="text-gray-900">
                        {questionPaper.timeLimit} minutes
                      </p>
                    </div>
                  </div>
                )}

                {questionPaper._count && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Questions Count
                    </p>
                    <p className="text-gray-900">
                      {questionPaper._count.questionPaperQuestions}
                    </p>
                  </div>
                )}

                <div className="flex items-center">
                  {getStatusIcon(questionPaper.isActive)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        questionPaper.isActive
                      )}`}
                    >
                      {questionPaper.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Metadata
              </h4>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Created At
                    </p>
                    <p className="text-gray-900">
                      {formatDate(questionPaper.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Last Updated
                    </p>
                    <p className="text-gray-900">
                      {formatDateTime(questionPaper.updatedAt)}
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

