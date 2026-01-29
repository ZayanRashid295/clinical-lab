import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  HelpCircle,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen,
  Tag,
  Award,
} from "lucide-react";
import {
  Question,
  CreateQuestionDto,
  UpdateQuestionDto,
} from "../../types/question";
import { QuestionsService } from "../../services/questions/questions.service";
import { TopicsService } from "../../services/content/topics.service";
import { ProductTagsService } from "../../services/products/product-tags.service";
import { Topic } from "../../types/content";
import { ProductTag } from "../../types/product";
import { CreateResponse } from "../../services/base/api-types";

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  question?: Question | null;
  onQuestionSaved: (question: Question) => void;
  mode: "create" | "edit";
}

export default function QuestionFormModal({
  isOpen,
  onClose,
  question,
  onQuestionSaved,
  mode,
}: QuestionFormModalProps) {
  const [formData, setFormData] = useState<CreateQuestionDto>({
    topicId: "",
    productTagId: "",
    question: "",
    explanation: "",
    difficulty: "medium",
    points: 1,
    isActive: true,
  });
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const questionsService = useMemo(() => new QuestionsService(), []);
  const topicsService = useMemo(() => new TopicsService(), []);
  const tagsService = useMemo(() => new ProductTagsService(), []);
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      // Load topics
      setLoadingTopics(true);
      topicsService
        .getTopics({ status: "ACTIVE" })
        .then((response) => {
          if (Array.isArray(response)) {
            setTopics(response);
          } else {
            setTopics(response.data || []);
          }
        })
        .catch(() => {
          setTopics([]);
        })
        .finally(() => {
          setLoadingTopics(false);
        });

      // Load tags
      setLoadingTags(true);
      tagsService
        .getTags({ status: "ACTIVE" })
        .then((response) => {
          if (Array.isArray(response)) {
            setTags(response);
          } else {
            setTags(response.data || []);
          }
        })
        .catch(() => {
          setTags([]);
        })
        .finally(() => {
          setLoadingTags(false);
        });

      if (isCreateMode) {
        setFormData({
          topicId: "",
          productTagId: "",
          question: "",
          explanation: "",
          difficulty: "medium",
          points: 1,
          isActive: true,
        });
      } else if (question) {
        setFormData({
          topicId: question.topicId,
          productTagId: question.productTagId || "",
          question: question.question,
          explanation: question.explanation || "",
          difficulty: question.difficulty,
          points: question.points,
          isActive: question.isActive,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, question, isCreateMode, topicsService, tagsService]);

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
          ? value ? parseInt(value) : undefined
          : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.topicId.trim()) {
      return "Topic is required";
    }
    if (!formData.question.trim()) {
      return "Question text is required";
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
        const createData: CreateQuestionDto = {
          topicId: formData.topicId,
          productTagId: formData.productTagId || undefined,
          question: formData.question,
          explanation: formData.explanation,
          difficulty: formData.difficulty,
          points: formData.points,
          isActive: formData.isActive,
        };
        const response = await questionsService.createQuestion(createData);
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either CreateResponse or Question
          if ("topicId" in response && "question" in response) {
            // It's a Question
            onQuestionSaved(response);
            onClose();
          } else {
            // It's a CreateResponse, refetch the created entity
            const createResponse = response as CreateResponse;
            questionsService
              .getQuestion(createResponse.id)
              .then((entity) => {
                onQuestionSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      } else if (question) {
        const updateData: UpdateQuestionDto = {
          topicId: formData.topicId,
          productTagId: formData.productTagId || undefined,
          question: formData.question,
          explanation: formData.explanation,
          difficulty: formData.difficulty,
          points: formData.points,
          isActive: formData.isActive,
        };
        const response = await questionsService.updateQuestion(
          question.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either UpdateResponse or Question
          if ("topicId" in response && "question" in response) {
            // It's a Question
            onQuestionSaved(response);
            onClose();
          } else {
            // It's an UpdateResponse, refetch the updated entity
            questionsService
              .getQuestion(question.id)
              .then((entity) => {
                onQuestionSaved(entity);
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
          "Failed to save question"
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
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <HelpCircle className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create Question" : "Edit Question"}
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
                Question saved successfully!
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              {loadingTags ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading subjects...
                </div>
              ) : (
                <select
                  name="productTagId"
                  value={formData.productTagId || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">None</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic *
              </label>
              {loadingTopics ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading topics...
                </div>
              ) : (
                <select
                  name="topicId"
                  value={formData.topicId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                      {topic.chapter?.name && ` (${topic.chapter.name})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text *
              </label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="points"
                    value={formData.points || 1}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active
              </label>
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
              disabled={loading || loadingTopics || loadingTags}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

