import React from "react";
import { HelpCircle, Tag, Award, TrendingUp } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { Question, QuestionFilters } from "../../types/question";

const questionColumns: ColumnConfig<Question>[] = [
  {
    key: "question",
    label: "Question",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center max-w-lg">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900 line-clamp-2">
            {value}
          </div>
          {row.explanation && (
            <div className="text-sm text-gray-500 truncate max-w-md mt-1">
              {row.explanation.substring(0, 60)}...
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "topic",
    label: "Topic",
    sortable: false,
    render: (value, row) => {
      const topicName = row.topic?.name || "-";
      const chapterName = row.topic?.chapter?.name;
      const sectionName = row.topic?.chapter?.section?.name;
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">{topicName}</div>
          {chapterName && (
            <div className="text-xs text-gray-500">{chapterName}</div>
          )}
          {sectionName && (
            <div className="text-xs text-gray-400">{sectionName}</div>
          )}
        </div>
      );
    },
  },
  {
    key: "productTag",
    label: "Tag",
    sortable: false,
    render: (value) => {
      if (!value) return <span className="text-sm text-gray-400">-</span>;
      return (
        <span
          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
          style={{
            backgroundColor: value.color ? `${value.color}20` : "#f3f4f6",
            color: value.color || "#6b7280",
          }}
        >
          <Tag className="h-3 w-3 mr-1" />
          {value.name}
        </span>
      );
    },
  },
  {
    key: "difficulty",
    label: "Difficulty",
    sortable: true,
    render: (value) => {
      const difficultyColors: Record<string, string> = {
        easy: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800",
        hard: "bg-red-100 text-red-800",
      };
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            difficultyColors[value] || "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      );
    },
  },
  {
    key: "points",
    label: "Points",
    sortable: true,
    render: (value) => (
      <div className="flex items-center">
        <Award className="h-4 w-4 text-gray-400 mr-1" />
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    ),
  },
  {
    key: "choices",
    label: "Choices",
    sortable: false,
    render: (value) => {
      const choices = Array.isArray(value) ? value : [];
      return (
        <span className="text-sm text-gray-900">{choices.length}</span>
      );
    },
  },
  {
    key: "isActive",
    label: "Status",
    sortable: true,
    render: (value) => {
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </span>
      );
    },
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    render: (value) => {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value));
    },
  },
];

const questionFilterConfig: FilterConfig<QuestionFilters> = {
  fields: [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
    {
      key: "difficulty",
      label: "Difficulty",
      type: "select",
      options: [
        { value: "easy", label: "Easy" },
        { value: "medium", label: "Medium" },
        { value: "hard", label: "Hard" },
      ],
    },
    {
      key: "topicId",
      label: "Topic",
      type: "text",
      placeholder: "Filter by topic ID",
    },
    {
      key: "productTagId",
      label: "Tag",
      type: "text",
      placeholder: "Filter by tag ID",
    },
    {
      key: "dateFrom",
      label: "Date",
      type: "dateRange",
    },
  ],
  layout: "grid",
  showActiveFilters: true,
};

const getQuestionStats = async () => {
  const { QuestionsService } = await import("../../services/questions/questions.service");
  const service = new QuestionsService();
  return service.getQuestionStats();
};

const questionStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Questions",
      icon: <HelpCircle className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <TrendingUp className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <HelpCircle className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getQuestionStats,
};

export const questionTableConfig: TableConfig<Question, QuestionFilters> = {
  title: "Question Management",
  description: "Manage questions and their answers",
  columns: questionColumns,
  filterConfig: questionFilterConfig,
  stats: questionStatsConfig,
  emptyStateIcon: (
    <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No questions found",
  addButtonLabel: "Add Question",
};

