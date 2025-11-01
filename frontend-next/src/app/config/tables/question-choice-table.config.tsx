import React from "react";
import { Circle, CheckCircle, XCircle, Hash } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import {
  QuestionChoice,
  QuestionChoiceFilters,
} from "../../types/question";

const questionChoiceColumns: ColumnConfig<QuestionChoice>[] = [
  {
    key: "order",
    label: "Order",
    sortable: true,
    render: (value) => (
      <div className="flex items-center">
        <Hash className="h-4 w-4 text-gray-400 mr-1" />
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    ),
  },
  {
    key: "text",
    label: "Choice Text",
    sortable: false,
    render: (value) => (
      <div className="max-w-md">
        <span className="text-sm text-gray-900">{value}</span>
      </div>
    ),
  },
  {
    key: "question",
    label: "Question",
    sortable: false,
    render: (value, row) => {
      const questionText = row.question?.question
        ? row.question.question.substring(0, 80) +
          (row.question.question.length > 80 ? "..." : "")
        : "-";
      return (
        <div className="max-w-md">
          <span className="text-sm text-gray-900">{questionText}</span>
          {row.question?.topic?.name && (
            <div className="text-xs text-gray-500 mt-1">
              {row.question.topic.name}
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: "isCorrect",
    label: "Correct",
    sortable: false,
    render: (value) => {
      return value ? (
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
          <span className="text-sm text-green-700">Correct</span>
        </div>
      ) : (
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-1" />
          <span className="text-sm text-red-700">Incorrect</span>
        </div>
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

const questionChoiceFilterConfig: FilterConfig<QuestionChoiceFilters> = {
  fields: [
    {
      key: "questionId",
      label: "Question",
      type: "text",
      placeholder: "Filter by question ID",
    },
    {
      key: "isCorrect",
      label: "Correct",
      type: "select",
      options: [
        { value: "true", label: "Correct" },
        { value: "false", label: "Incorrect" },
      ],
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

const getQuestionChoiceStats = async () => {
  const { QuestionChoicesService } =
    await import("../../services/questions/question-choices.service");
  const service = new QuestionChoicesService();
  return service.getQuestionChoiceStats();
};

const questionChoiceStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Choices",
      icon: <Circle className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "correct",
      label: "Correct",
      icon: <CheckCircle className="h-8 w-8" />,
      getValue: (stats) => stats?.correct || 0,
    },
    {
      key: "incorrect",
      label: "Incorrect",
      icon: <XCircle className="h-8 w-8" />,
      getValue: (stats) => stats?.incorrect || 0,
    },
  ],
  getStats: getQuestionChoiceStats,
};

export const questionChoiceTableConfig: TableConfig<
  QuestionChoice,
  QuestionChoiceFilters
> = {
  title: "Question Choice Management",
  description: "Manage choices for questions",
  columns: questionChoiceColumns,
  filterConfig: questionChoiceFilterConfig,
  stats: questionChoiceStatsConfig,
  emptyStateIcon: (
    <Circle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No question choices found",
  addButtonLabel: "Add Choice",
};

