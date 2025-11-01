import React from "react";
import { HelpCircle, FileText, Hash, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import {
  QuestionPaperQuestion,
  QuestionPaperQuestionFilters,
} from "../../types/question-paper-question";

const questionPaperQuestionColumns: ColumnConfig<QuestionPaperQuestion>[] = [
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
    key: "questionPaper",
    label: "Question Paper",
    sortable: false,
    render: (value, row) => {
      const paperName = row.questionPaper?.name || "-";
      return (
        <div className="flex items-center">
          <FileText className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{paperName}</span>
        </div>
      );
    },
  },
  {
    key: "question",
    label: "Question",
    sortable: false,
    render: (value, row) => {
      const questionText = row.question?.text
        ? row.question.text.substring(0, 80) +
          (row.question.text.length > 80 ? "..." : "")
        : "-";
      return (
        <div className="flex items-center max-w-md">
          <HelpCircle className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          <span className="text-sm text-gray-900 truncate">{questionText}</span>
        </div>
      );
    },
  },
  {
    key: "userAnswer",
    label: "Answer",
    sortable: false,
    render: (value) => {
      if (!value) {
        return <span className="text-sm text-gray-400">Not answered</span>;
      }
      return (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      );
    },
  },
  {
    key: "isCorrect",
    label: "Correct",
    sortable: false,
    render: (value) => {
      if (value === undefined || value === null) {
        return <span className="text-sm text-gray-400">-</span>;
      }
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
    key: "timeSpent",
    label: "Time Spent",
    sortable: true,
    render: (value) => {
      if (!value) {
        return <span className="text-sm text-gray-400">-</span>;
      }
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">
            {minutes > 0 ? `${minutes}m ` : ""}
            {seconds}s
          </span>
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

const questionPaperQuestionFilterConfig: FilterConfig<QuestionPaperQuestionFilters> =
  {
    fields: [
      {
        key: "questionPaperId",
        label: "Question Paper",
        type: "text",
        placeholder: "Filter by question paper ID",
      },
      {
        key: "hasAnswer",
        label: "Has Answer",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
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

const getQuestionPaperQuestionStats = async () => {
  const { QuestionPaperQuestionsService } =
    await import("../../services/assessments/question-paper-questions.service");
  const service = new QuestionPaperQuestionsService();
  return service.getQuestionPaperQuestionStats();
};

const questionPaperQuestionStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total",
      icon: <HelpCircle className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "answered",
      label: "Answered",
      icon: <CheckCircle className="h-8 w-8" />,
      getValue: (stats) => stats?.answered || 0,
    },
    {
      key: "unanswered",
      label: "Unanswered",
      icon: <XCircle className="h-8 w-8" />,
      getValue: (stats) => stats?.unanswered || 0,
    },
    {
      key: "correct",
      label: "Correct",
      icon: <CheckCircle className="h-8 w-8" />,
      getValue: (stats) => stats?.correct || 0,
    },
  ],
  getStats: getQuestionPaperQuestionStats,
};

export const questionPaperQuestionTableConfig: TableConfig<
  QuestionPaperQuestion,
  QuestionPaperQuestionFilters
> = {
  title: "Question Paper Question Management",
  description: "Manage questions in question papers",
  columns: questionPaperQuestionColumns,
  filterConfig: questionPaperQuestionFilterConfig,
  stats: questionPaperQuestionStatsConfig,
  emptyStateIcon: (
    <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No question paper questions found",
  addButtonLabel: "Add Question to Paper",
};

