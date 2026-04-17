import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Circle,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Hash,
  HelpCircle,
} from "lucide-react";
import {
  QuestionChoice,
  CreateQuestionChoiceDto,
  UpdateQuestionChoiceDto,
} from "../../types/question";
import { QuestionChoicesService } from "../../services/questions/question-choices.service";
import { QuestionsService } from "../../services/questions/questions.service";
import { Question } from "../../types/question";
import { CreateResponse } from "../../services/base/api-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SELECT_EMPTY_VALUE,
} from "@/shared/ui/select";

interface QuestionChoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionChoice?: QuestionChoice | null;
  onQuestionChoiceSaved: (questionChoice: QuestionChoice) => void;
  mode: "create" | "edit";
}

export default function QuestionChoiceFormModal({
  isOpen,
  onClose,
  questionChoice,
  onQuestionChoiceSaved,
  mode,
}: QuestionChoiceFormModalProps) {
  const [formData, setFormData] = useState<CreateQuestionChoiceDto>({
    questionId: "",
    text: "",
    isCorrect: false,
    order: 0,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const questionChoicesService = useMemo(() => new QuestionChoicesService(), []);
  const questionsService = useMemo(() => new QuestionsService(), []);
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      // Load questions
      setLoadingQuestions(true);
      questionsService
        .getQuestions({ status: "ACTIVE", listAll: true })
        .then((response) => {
          if (Array.isArray(response)) {
            setQuestions(response);
          } else {
            setQuestions(response.data || []);
          }
        })
        .catch(() => {
          setQuestions([]);
        })
        .finally(() => {
          setLoadingQuestions(false);
        });

      if (isCreateMode) {
        setFormData({
          questionId: "",
          text: "",
          isCorrect: false,
          order: 0,
        });
      } else if (questionChoice) {
        setFormData({
          questionId: questionChoice.questionId,
          text: questionChoice.text,
          isCorrect: questionChoice.isCorrect,
          order: questionChoice.order,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, questionChoice, isCreateMode, questionsService]);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value ? parseInt(value) : undefined
          : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.questionId.trim()) {
      return "Question is required";
    }
    if (!formData.text.trim()) {
      return "Choice text is required";
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
        const createData: CreateQuestionChoiceDto = {
          questionId: formData.questionId,
          text: formData.text,
          isCorrect: formData.isCorrect,
          order: formData.order,
        };
        const response = await questionChoicesService.createQuestionChoice(
          createData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either CreateResponse or QuestionChoice
          if ("questionId" in response && "text" in response) {
            // It's a QuestionChoice
            onQuestionChoiceSaved(response);
            onClose();
          } else {
            // It's a CreateResponse, refetch the created entity
            const createResponse = response as CreateResponse;
            questionChoicesService
              .getQuestionChoice(createResponse.id)
              .then((entity) => {
                onQuestionChoiceSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      } else if (questionChoice) {
        const updateData: UpdateQuestionChoiceDto = {
          text: formData.text,
          isCorrect: formData.isCorrect,
          order: formData.order,
        };
        const response = await questionChoicesService.updateQuestionChoice(
          questionChoice.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either UpdateResponse or QuestionChoice
          if ("questionId" in response && "text" in response) {
            // It's a QuestionChoice
            onQuestionChoiceSaved(response);
            onClose();
          } else {
            // It's an UpdateResponse, refetch the updated entity
            questionChoicesService
              .getQuestionChoice(questionChoice.id)
              .then((entity) => {
                onQuestionChoiceSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save question choice"
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
            <Circle className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create Choice" : "Edit Choice"}
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
                Question choice saved successfully!
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              {loadingQuestions ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading questions...
                </div>
              ) : (
                <Select
                  value={formData.questionId || SELECT_EMPTY_VALUE}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      questionId: v === SELECT_EMPTY_VALUE ? "" : v,
                    }))
                  }
                  disabled={!isCreateMode}
                >
                  <SelectTrigger className="h-10 w-full border-gray-300 focus:ring-2 focus:ring-indigo-500">
                    <SelectValue placeholder="Select a question" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value={SELECT_EMPTY_VALUE} className="text-gray-500">
                      Select a question
                    </SelectItem>
                    {questions.map((question) => {
                      const q = question.question || "";
                      const label = q.length > 80 ? `${q.substring(0, 80)}...` : q;
                      return (
                        <SelectItem key={question.id} value={question.id}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choice Text *
              </label>
              <textarea
                name="text"
                value={formData.text}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  name="isCorrect"
                  checked={formData.isCorrect}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Correct Answer
                </label>
              </div>
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
              disabled={loading || loadingQuestions}
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

