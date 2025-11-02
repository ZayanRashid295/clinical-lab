import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
} from "lucide-react";
import {
  QuestionPaper,
  CreateQuestionPaperDto,
  UpdateQuestionPaperDto,
} from "../../types/assessment";
import { QuestionPapersService } from "../../services/assessments/question-papers.service";
import { UsersService } from "../../services/users/users.service";
import { User } from "../../types/user";
import { CreateResponse } from "../../services/base/api-types";

interface QuestionPaperFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionPaper?: QuestionPaper | null;
  onQuestionPaperSaved: (questionPaper: QuestionPaper) => void;
  mode: "create" | "edit";
}

export default function QuestionPaperFormModal({
  isOpen,
  onClose,
  questionPaper,
  onQuestionPaperSaved,
  mode,
}: QuestionPaperFormModalProps) {
  const [formData, setFormData] = useState<CreateQuestionPaperDto>({
    userId: "",
    name: "",
    description: "",
    type: "practice",
    totalQuestions: 0,
    timeLimit: undefined,
    isActive: true,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const questionPapersService = new QuestionPapersService();
  const usersService = new UsersService();
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      // Load users
      setLoadingUsers(true);
      usersService
        .getUsers({ limit: 100, status: "ACTIVE" })
        .then((response) => {
          if (Array.isArray(response)) {
            setUsers(response);
          } else {
            setUsers(response.data || []);
          }
        })
        .catch(() => {
          setUsers([]);
        })
        .finally(() => {
          setLoadingUsers(false);
        });

      if (isCreateMode) {
        setFormData({
          userId: "",
          name: "",
          description: "",
          type: "practice",
          totalQuestions: 0,
          timeLimit: undefined,
          isActive: true,
        });
      } else if (questionPaper) {
        setFormData({
          userId: questionPaper.userId,
          name: questionPaper.name,
          description: questionPaper.description || "",
          type: questionPaper.type,
          totalQuestions: questionPaper.totalQuestions,
          timeLimit: questionPaper.timeLimit || undefined,
          isActive: questionPaper.isActive,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, questionPaper, isCreateMode]);

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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value
            ? parseInt(value)
            : undefined
          : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.userId.trim()) {
      return "User is required";
    }
    if (!formData.name.trim()) {
      return "Question paper name is required";
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
        const createData: CreateQuestionPaperDto = {
          userId: formData.userId,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          totalQuestions: formData.totalQuestions,
          timeLimit: formData.timeLimit,
          isActive: formData.isActive,
        };
        const response = await questionPapersService.createQuestionPaper(
          createData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either CreateResponse or QuestionPaper
          if ("userId" in response && "name" in response) {
            // It's a QuestionPaper
            onQuestionPaperSaved(response);
            onClose();
          } else {
            // It's a CreateResponse, refetch the created entity
            const createResponse = response as CreateResponse;
            questionPapersService
              .getQuestionPaper(createResponse.id)
              .then((entity) => {
                onQuestionPaperSaved(entity);
                onClose();
              })
              .catch(() => {
                // Fallback: close modal anyway if refetch fails
                onClose();
              });
          }
        }, 1000);
      } else if (questionPaper) {
        const updateData: UpdateQuestionPaperDto = {
          userId: formData.userId,
          name: formData.name,
          description: formData.description,
          type: formData.type,
          totalQuestions: formData.totalQuestions,
          timeLimit: formData.timeLimit,
          isActive: formData.isActive,
        };
        const response = await questionPapersService.updateQuestionPaper(
          questionPaper.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either UpdateResponse or QuestionPaper
          if ("userId" in response && "name" in response) {
            // It's a QuestionPaper
            onQuestionPaperSaved(response);
            onClose();
          } else {
            // It's an UpdateResponse, refetch the updated entity
            questionPapersService
              .getQuestionPaper(questionPaper.id)
              .then((entity) => {
                onQuestionPaperSaved(entity);
                onClose();
              })
              .catch(() => {
                // Fallback: close modal anyway if refetch fails
                onClose();
              });
          }
        }, 1000);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save question paper"
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
            <FileText className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create Question Paper" : "Edit Question Paper"}
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
                Question paper saved successfully!
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User *
              </label>
              {loadingUsers ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading users...
                </div>
              ) : (
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Paper Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="practice">Practice</option>
                <option value="mock">Mock</option>
                <option value="assessment">Assessment</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Questions
                </label>
                <input
                  type="number"
                  name="totalQuestions"
                  value={formData.totalQuestions || 0}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (minutes)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="timeLimit"
                    value={formData.timeLimit || ""}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Optional"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Active</label>
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
              disabled={loading || loadingUsers}
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
                  {isCreateMode ? "Create" : "Update"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
