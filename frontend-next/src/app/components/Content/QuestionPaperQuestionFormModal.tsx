import React, { useState, useEffect } from "react";
import {
  X,
  HelpCircle,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Hash,
} from "lucide-react";
import {
  QuestionPaperQuestion,
  CreateQuestionPaperQuestionDto,
  UpdateQuestionPaperQuestionDto,
} from "../../types/question-paper-question";
import { QuestionPapersService } from "../../services/assessments/question-papers.service";
import { QuestionPaperQuestionsService } from "../../services/assessments/question-paper-questions.service";

interface QuestionPaperQuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionPaperQuestion?: QuestionPaperQuestion | null;
  onQuestionPaperQuestionSaved: (
    questionPaperQuestion: QuestionPaperQuestion
  ) => void;
  mode: "create" | "edit";
}

export default function QuestionPaperQuestionFormModal({
  isOpen,
  onClose,
  questionPaperQuestion,
  onQuestionPaperQuestionSaved,
  mode,
}: QuestionPaperQuestionFormModalProps) {
  const [formData, setFormData] = useState<CreateQuestionPaperQuestionDto>({
    questionPaperId: "",
    questionId: "",
    order: 0,
  });
  const [questionPapers, setQuestionPapers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestionPapers, setLoadingQuestionPapers] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const questionPaperQuestionsService = new QuestionPaperQuestionsService();
  const questionPapersService = new QuestionPapersService();
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      // Load question papers
      setLoadingQuestionPapers(true);
      questionPapersService
        .getQuestionPapers({ limit: 100, status: "ACTIVE" })
        .then((response) => {
          if (Array.isArray(response)) {
            setQuestionPapers(response);
          } else {
            setQuestionPapers(response.data || []);
          }
        })
        .catch(() => {
          setQuestionPapers([]);
        })
        .finally(() => {
          setLoadingQuestionPapers(false);
        });

      // Load questions - you'll need to implement a questions service
      // For now, we'll use an empty array
      setQuestions([]);

      if (isCreateMode) {
        setFormData({
          questionPaperId: "",
          questionId: "",
          order: 0,
        });
      } else if (questionPaperQuestion) {
        setFormData({
          questionPaperId: questionPaperQuestion.questionPaperId,
          questionId: questionPaperQuestion.questionId,
          order: questionPaperQuestion.order,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, questionPaperQuestion, isCreateMode]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "order" ? (value ? parseInt(value) : 0) : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.questionPaperId.trim()) {
      return "Question paper is required";
    }
    if (!formData.questionId.trim()) {
      return "Question is required";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isCreateMode) {
        const createData: CreateQuestionPaperQuestionDto = {
          questionPaperId: formData.questionPaperId,
          questionId: formData.questionId,
          order: formData.order,
        };
        const response =
          await questionPaperQuestionsService.createQuestionPaperQuestion(
            createData
          );
        setSuccess(true);
        setTimeout(() => {
          onQuestionPaperQuestionSaved(response.data || response);
          onClose();
        }, 1000);
      } else if (questionPaperQuestion) {
        const updateData: UpdateQuestionPaperQuestionDto = {
          order: formData.order,
        };
        const response =
          await questionPaperQuestionsService.updateQuestionPaperQuestion(
            questionPaperQuestion.id,
            updateData
          );
        setSuccess(true);
        setTimeout(() => {
          onQuestionPaperQuestionSaved(response.data || response);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save question paper question"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <HelpCircle className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode
                ? "Add Question to Paper"
                : "Edit Question Paper Question"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">
                Question paper question saved successfully!
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Paper *
              </label>
              {loadingQuestionPapers ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading question papers...
                </div>
              ) : (
                <select
                  name="questionPaperId"
                  value={formData.questionPaperId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={!isCreateMode}
                >
                  <option value="">Select a question paper</option>
                  {questionPapers.map((paper: any) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.name} ({paper.type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              <input
                type="text"
                name="questionId"
                value={formData.questionId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={!isCreateMode}
                placeholder="Enter question ID"
              />
              <p className="mt-1 text-xs text-gray-500">
                Note: Question selection will be improved in a future update
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="order"
                  value={formData.order || 0}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Order of the question in the paper (0 = auto-assign)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingQuestionPapers}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreateMode ? "Add" : "Update"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

