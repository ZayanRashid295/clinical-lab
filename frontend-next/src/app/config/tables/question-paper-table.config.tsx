import React from "react";
import { FileText, User, Clock, Hash } from "lucide-react";
import {
  TableConfig,
  ColumnConfig,
  FilterConfig,
  StatsConfig,
} from "../../../shared/components/DataTable/types";
import { QuestionPaper, QuestionPaperFilters } from "../../types/assessment";

const questionPaperColumns: ColumnConfig<QuestionPaper>[] = [
  {
    key: "name",
    label: "Question Paper Name",
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {row.description}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "user",
    label: "User",
    sortable: false,
    render: (value, row) => {
      const userName = row.user
        ? `${row.user.firstName} ${row.user.lastName}`
        : "-";
      return (
        <div className="flex items-center">
          <User className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{userName}</span>
        </div>
      );
    },
  },
  {
    key: "type",
    label: "Type",
    sortable: true,
    render: (value) => {
      const typeColors: Record<string, string> = {
        practice: "bg-blue-100 text-blue-800",
        mock: "bg-purple-100 text-purple-800",
        assessment: "bg-green-100 text-green-800",
      };
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            typeColors[value] || "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      );
    },
  },
  {
    key: "_count",
    label: "Questions",
    sortable: false,
    render: (value) => {
      const count = value?.questionPaperQuestions || 0;
      return (
        <div className="flex items-center">
          <Hash className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">{count}</span>
        </div>
      );
    },
  },
  {
    key: "timeLimit",
    label: "Time Limit",
    sortable: false,
    render: (value) => {
      if (!value) return <span className="text-sm text-gray-400">-</span>;
      return (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm text-gray-900">{value} min</span>
        </div>
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

const questionPaperFilterConfig: FilterConfig<QuestionPaperFilters> = {
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
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { value: "practice", label: "Practice" },
        { value: "mock", label: "Mock" },
        { value: "assessment", label: "Assessment" },
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

const getQuestionPaperStats = async () => {
  const { QuestionPapersService } = await import("../../services/assessments/question-papers.service");
  const service = new QuestionPapersService();
  return service.getQuestionPaperStats();
};

const questionPaperStatsConfig: StatsConfig = {
  cards: [
    {
      key: "total",
      label: "Total Papers",
      icon: <FileText className="h-8 w-8" />,
      getValue: (stats) => stats?.total || 0,
    },
    {
      key: "active",
      label: "Active",
      icon: <FileText className="h-8 w-8" />,
      getValue: (stats) => stats?.active || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: <FileText className="h-8 w-8" />,
      getValue: (stats) => stats?.inactive || 0,
    },
  ],
  getStats: getQuestionPaperStats,
};

export const questionPaperTableConfig: TableConfig<
  QuestionPaper,
  QuestionPaperFilters
> = {
  title: "Question Paper Management",
  description: "Manage assessment question papers",
  columns: questionPaperColumns,
  filterConfig: questionPaperFilterConfig,
  stats: questionPaperStatsConfig,
  emptyStateIcon: (
    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
  ),
  emptyStateMessage: "No question papers found",
  addButtonLabel: "Add Question Paper",
};

