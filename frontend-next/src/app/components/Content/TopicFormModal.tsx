import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  FileText,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import {
  Topic,
  CreateTopicDto,
  UpdateTopicDto,
} from "../../types/content";
import { TopicsService } from "../../services/content/topics.service";
import { ChaptersService } from "../../services/content/chapters.service";
import { Chapter } from "../../types/content";
import { CreateResponse } from "../../services/base/api-types";

interface TopicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: Topic | null;
  onTopicSaved: (topic: Topic) => void;
  mode: "create" | "edit";
}

export default function TopicFormModal({
  isOpen,
  onClose,
  topic,
  onTopicSaved,
  mode,
}: TopicFormModalProps) {
  const [formData, setFormData] = useState<CreateTopicDto>({
    chapterId: "",
    name: "",
    description: "",
    order: 0,
    isActive: true,
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const topicsService = useMemo(() => new TopicsService(), []);
  const chaptersService = useMemo(() => new ChaptersService(), []);
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      // Load chapters
      setLoadingChapters(true);
      chaptersService
        .getChapters({ status: "ACTIVE" })
        .then((response) => {
          if (Array.isArray(response)) {
            setChapters(response);
          } else {
            setChapters(response.data || []);
          }
        })
        .catch(() => {
          setChapters([]);
        })
        .finally(() => {
          setLoadingChapters(false);
        });

      if (isCreateMode) {
        setFormData({
          chapterId: "",
          name: "",
          description: "",
          order: 0,
          isActive: true,
        });
      } else if (topic) {
        setFormData({
          chapterId: topic.chapterId,
          name: topic.name,
          description: topic.description || "",
          order: topic.order,
          isActive: topic.isActive,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, topic, isCreateMode, chaptersService]);

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
          ? parseInt(value) || 0
          : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.chapterId.trim()) {
      return "Chapter is required";
    }
    if (!formData.name.trim()) {
      return "Topic name is required";
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
        const response = await topicsService.createTopic(formData);
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either CreateResponse or Topic
          if ("chapterId" in response && "name" in response) {
            // It's a Topic
            onTopicSaved(response);
            onClose();
          } else {
            // It's a CreateResponse, refetch the created entity
            const createResponse = response as CreateResponse;
            topicsService
              .getTopic(createResponse.id)
              .then((entity) => {
                onTopicSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      } else if (topic) {
        const updateData: UpdateTopicDto = {
          chapterId: formData.chapterId,
          name: formData.name,
          description: formData.description,
          order: formData.order,
          isActive: formData.isActive,
        };
        const response = await topicsService.updateTopic(
          topic.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either UpdateResponse or Topic
          if ("chapterId" in response && "name" in response) {
            // It's a Topic
            onTopicSaved(response);
            onClose();
          } else {
            // It's an UpdateResponse, refetch the updated entity
            topicsService
              .getTopic(topic.id)
              .then((entity) => {
                onTopicSaved(entity);
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
          "Failed to save topic"
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
            <FileText className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create Topic" : "Edit Topic"}
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
              <span className="text-green-700">Topic saved successfully!</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter *
              </label>
              {loadingChapters ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Loading chapters...
                </div>
              ) : (
                <select
                  name="chapterId"
                  value={formData.chapterId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name} {chapter.section && `(${chapter.section.name})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
              disabled={loading || loadingChapters}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

