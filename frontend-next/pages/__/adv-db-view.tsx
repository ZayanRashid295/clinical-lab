import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Download,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
} from "lucide-react";

interface ForeignKeyInfo {
  tableName: string;
  columnName: string;
  relationName?: string;
  reverseRelationName?: string;
}

interface Field {
  id: string;
  name: string;
  type: string;
  primaryKey?: boolean;
  unique?: boolean;
  foreignKey?: ForeignKeyInfo;
}

interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  column: number;
  fields: Field[];
}

interface Module {
  moduleName: string;
  tables: Table[];
}

interface ProjectData {
  projectName: string;
  description: string;
  modules: Module[];
  base: Table[];
}

interface TypeSelector {
  tableId: string;
  fieldId: string;
  x: number;
  y: number;
}

interface FieldUpdates {
  name?: string;
  type?: string;
  primaryKey?: boolean;
  unique?: boolean;
  foreignKey?: ForeignKeyInfo;
}

type AnchorSide = "left" | "right";

type AnchorKey = `${string}:${string}:${AnchorSide}`;

type Point = { x: number; y: number };

type Connection = {
  id: string;
  from: { tableId: string; fieldId: string };
  to: { tableId: string; fieldId: string };
  colorClass: string;
  number: number;
};

const tableColors = [
  { header: "from-violet-600 to-violet-700", body: "bg-violet-50" },
  { header: "from-cyan-600 to-cyan-700", body: "bg-cyan-50" },
  { header: "from-blue-600 to-blue-700", body: "bg-blue-50" },
  { header: "from-purple-600 to-purple-700", body: "bg-purple-50" },
  { header: "from-amber-600 to-amber-700", body: "bg-amber-50" },
  { header: "from-red-600 to-red-700", body: "bg-red-50" },
  { header: "from-pink-600 to-pink-700", body: "bg-pink-50" },
  { header: "from-green-600 to-green-700", body: "bg-green-50" },
  { header: "from-indigo-600 to-indigo-700", body: "bg-indigo-50" },
  { header: "from-teal-600 to-teal-700", body: "bg-teal-50" },
  { header: "from-orange-600 to-orange-700", body: "bg-orange-50" },
  { header: "from-rose-600 to-rose-700", body: "bg-rose-50" },
  { header: "from-emerald-600 to-emerald-700", body: "bg-emerald-50" },
  { header: "from-slate-600 to-slate-700", body: "bg-slate-50" },
  { header: "from-stone-600 to-stone-700", body: "bg-stone-50" },
];

const relationshipColors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-rose-500",
];

const tailwindToHex: { [k: string]: string } = {
  "bg-red-500": "#ef4444",
  "bg-blue-500": "#3b82f6",
  "bg-green-500": "#22c55e",
  "bg-yellow-500": "#eab308",
  "bg-purple-500": "#a855f7",
  "bg-pink-500": "#ec4899",
  "bg-indigo-500": "#6366f1",
  "bg-teal-500": "#14b8a6",
  "bg-orange-500": "#f97316",
  "bg-cyan-500": "#06b6d4",
  "bg-lime-500": "#84cc16",
  "bg-emerald-500": "#10b981",
  "bg-violet-500": "#8b5cf6",
  "bg-fuchsia-500": "#d946ef",
  "bg-rose-500": "#f43f5e",
  "bg-gray-400": "#9ca3af",
};

const NUM_COLUMNS = 4;
const COLUMN_WIDTH = 350;
const TABLE_WIDTH = 240;
const COLUMN_START_X = 100;
const COLUMN_START_Y = 100;
const TABLE_VERTICAL_GAP = 40;

const CANVAS_WIDTH =
  COLUMN_START_X +
  (NUM_COLUMNS - 1) * COLUMN_WIDTH +
  TABLE_WIDTH +
  COLUMN_START_X;
const CANVAS_HEIGHT = 2500;

function hashToIndex(key: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

function getTableColor(tableId: string) {
  const index = hashToIndex(tableId, tableColors.length);
  return tableColors[index];
}

const initialData: ProjectData = {
  projectName: "Clinical Lab System",
  description:
    "Clinical laboratory management system with modules for authentication, content, payments, subscriptions, assessments, chat, and notifications",
  base: [
    {
      id: "users",
      name: "User",
      x: 0,
      y: 0,
      column: 0,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        { id: "email", name: "email", type: "string", unique: true },
        { id: "password", name: "password", type: "string" },
        { id: "phone", name: "phone", type: "string" },
        { id: "firstName", name: "firstName", type: "string" },
        { id: "lastName", name: "lastName", type: "string" },
        { id: "avatar", name: "avatar", type: "string" },
        { id: "isActive", name: "isActive", type: "boolean" },
        { id: "createdAt", name: "createdAt", type: "timestamp" },
        { id: "updatedAt", name: "updatedAt", type: "timestamp" },
      ],
    },
    {
      id: "user_settings",
      name: "UserSettings",
      x: 0,
      y: 0,
      column: 1,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        {
          id: "userId",
          name: "userId",
          type: "string",
          foreignKey: {
            tableName: "users",
            columnName: "id",
            reverseRelationName: "userSettings",
          },
          unique: true,
        },
        { id: "language", name: "language", type: "string" },
        { id: "timezone", name: "timezone", type: "string" },
        { id: "notifications", name: "notifications", type: "json" },
        { id: "privacySettings", name: "privacySettings", type: "json" },
        { id: "createdAt", name: "createdAt", type: "timestamp" },
        { id: "updatedAt", name: "updatedAt", type: "timestamp" },
      ],
    },
    {
      id: "roles",
      name: "Role",
      x: 0,
      y: 0,
      column: 2,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        { id: "name", name: "name", type: "string", unique: true },
        { id: "displayName", name: "displayName", type: "string" },
        { id: "description", name: "description", type: "string" },
        { id: "isActive", name: "isActive", type: "boolean" },
        { id: "createdAt", name: "createdAt", type: "timestamp" },
        { id: "updatedAt", name: "updatedAt", type: "timestamp" },
      ],
    },
    {
      id: "permissions",
      name: "Permission",
      x: 0,
      y: 0,
      column: 3,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        { id: "name", name: "name", type: "string", unique: true },
        { id: "description", name: "description", type: "string" },
        { id: "resource", name: "resource", type: "string" },
        { id: "action", name: "action", type: "string" },
        { id: "isActive", name: "isActive", type: "boolean" },
        { id: "createdAt", name: "createdAt", type: "timestamp" },
        { id: "updatedAt", name: "updatedAt", type: "timestamp" },
      ],
    },
    {
      id: "user_roles",
      name: "UserRole",
      x: 0,
      y: 0,
      column: 0,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        {
          id: "userId",
          name: "userId",
          type: "string",
          foreignKey: {
            tableName: "users",
            columnName: "id",
            reverseRelationName: "roles",
          },
        },
        {
          id: "roleId",
          name: "roleId",
          type: "string",
          foreignKey: {
            tableName: "roles",
            columnName: "id",
            reverseRelationName: "users",
          },
        },
      ],
    },
    {
      id: "user_permissions",
      name: "UserPermission",
      x: 0,
      y: 0,
      column: 1,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        {
          id: "userId",
          name: "userId",
          type: "string",
          foreignKey: {
            tableName: "users",
            columnName: "id",
            reverseRelationName: "permissions",
          },
        },
        {
          id: "permissionId",
          name: "permissionId",
          type: "string",
          foreignKey: {
            tableName: "permissions",
            columnName: "id",
            reverseRelationName: "users",
          },
        },
      ],
    },
    {
      id: "audit_logs",
      name: "AuditLog",
      x: 0,
      y: 0,
      column: 3,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        { id: "userId", name: "userId", type: "string" },
        { id: "action", name: "action", type: "string" },
        { id: "resource", name: "resource", type: "string" },
        { id: "resourceId", name: "resourceId", type: "string" },
        { id: "details", name: "details", type: "json" },
        { id: "ipAddress", name: "ipAddress", type: "string" },
        { id: "userAgent", name: "userAgent", type: "string" },
        { id: "createdAt", name: "createdAt", type: "timestamp" },
      ],
    },
    {
      id: "system_settings",
      name: "SystemSettings",
      x: 0,
      y: 0,
      column: 0,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        { id: "key", name: "key", type: "string", unique: true },
        { id: "value", name: "value", type: "string" },
        { id: "type", name: "type", type: "string" },
        { id: "isActive", name: "isActive", type: "boolean" },
        { id: "createdAt", name: "createdAt", type: "timestamp" },
        { id: "updatedAt", name: "updatedAt", type: "timestamp" },
      ],
    },
    {
      id: "institutions",
      name: "Institution",
      x: 0,
      y: 0,
      column: 1,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        { id: "name", name: "name", type: "string", unique: true },
        { id: "description", name: "description", type: "string" },
        { id: "address", name: "address", type: "string" },
        { id: "phone", name: "phone", type: "string" },
        { id: "email", name: "email", type: "string" },
        { id: "website", name: "website", type: "string" },
        { id: "isActive", name: "isActive", type: "boolean" },
        { id: "createdAt", name: "createdAt", type: "timestamp" },
        { id: "updatedAt", name: "updatedAt", type: "timestamp" },
      ],
    },
    {
      id: "institution_managers",
      name: "InstitutionManager",
      x: 0,
      y: 0,
      column: 2,
      fields: [
        { id: "id", name: "id", type: "string", primaryKey: true },
        {
          id: "userId",
          name: "userId",
          type: "string",
          foreignKey: {
            tableName: "users",
            columnName: "id",
            reverseRelationName: "institutionManager",
          },
          unique: true,
        },
        {
          id: "institutionId",
          name: "institutionId",
          type: "string",
          foreignKey: {
            tableName: "institutions",
            columnName: "id",
            reverseRelationName: "managers",
          },
        },
      ],
    },
  ],
  modules: [
    {
      moduleName: "Content",
      tables: [
        {
          id: "sections",
          name: "Section",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "productId",
              name: "productId",
              type: "string",
              foreignKey: {
                tableName: "products",
                columnName: "id",
                reverseRelationName: "sections",
              },
            },
            { id: "name", name: "name", type: "string" },
            { id: "description", name: "description", type: "string" },
            { id: "order", name: "order", type: "integer" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "chapters",
          name: "Chapter",
          x: 0,
          y: 0,
          column: 1,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "sectionId",
              name: "sectionId",
              type: "string",
              foreignKey: {
                tableName: "sections",
                columnName: "id",
                reverseRelationName: "chapters",
              },
            },
            { id: "name", name: "name", type: "string" },
            { id: "description", name: "description", type: "string" },
            { id: "order", name: "order", type: "integer" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "topics",
          name: "Topic",
          x: 0,
          y: 0,
          column: 2,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "chapterId",
              name: "chapterId",
              type: "string",
              foreignKey: {
                tableName: "chapters",
                columnName: "id",
                reverseRelationName: "topics",
              },
            },
            { id: "name", name: "name", type: "string" },
            { id: "description", name: "description", type: "string" },
            { id: "order", name: "order", type: "integer" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "questions",
          name: "Question",
          x: 0,
          y: 0,
          column: 3,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "topicId",
              name: "topicId",
              type: "string",
              foreignKey: {
                tableName: "topics",
                columnName: "id",
                reverseRelationName: "questions",
              },
            },
            {
              id: "productTagId",
              name: "productTagId",
              type: "string",
              foreignKey: {
                tableName: "product_tags",
                columnName: "id",
                reverseRelationName: "questions",
              },
            },
            { id: "question", name: "question", type: "text" },
            { id: "explanation", name: "explanation", type: "text" },
            { id: "difficulty", name: "difficulty", type: "string" },
            { id: "points", name: "points", type: "integer" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "question_choices",
          name: "QuestionChoice",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "questionId",
              name: "questionId",
              type: "string",
              foreignKey: {
                tableName: "questions",
                columnName: "id",
                reverseRelationName: "question_choices",
              },
            },
            { id: "text", name: "text", type: "text" },
            { id: "isCorrect", name: "isCorrect", type: "boolean" },
            { id: "order", name: "order", type: "integer" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
      ],
    },
    {
      moduleName: "Payment",
      tables: [
        {
          id: "payments",
          name: "Payment",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            {
              id: "subscriptionId",
              name: "subscriptionId",
              type: "string",
              foreignKey: {
                tableName: "subscriptions",
                columnName: "id",
                reverseRelationName: "payments",
              },
            },
            { id: "amount", name: "amount", type: "decimal" },
            { id: "currency", name: "currency", type: "string" },
            { id: "status", name: "status", type: "enum" },
            { id: "method", name: "method", type: "enum" },
            {
              id: "transactionId",
              name: "transactionId",
              type: "string",
              unique: true,
            },
            { id: "gateway", name: "gateway", type: "enum" },
            { id: "gatewayData", name: "gatewayData", type: "json" },
            { id: "description", name: "description", type: "string" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "refunds",
          name: "Refund",
          x: 0,
          y: 0,
          column: 1,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "paymentId",
              name: "paymentId",
              type: "string",
              foreignKey: { tableName: "payments", columnName: "id" },
            },
            { id: "amount", name: "amount", type: "decimal" },
            { id: "reason", name: "reason", type: "string" },
            { id: "status", name: "status", type: "enum" },
            { id: "gatewayRefundId", name: "gatewayRefundId", type: "string" },
            { id: "processedAt", name: "processedAt", type: "timestamp" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "wallets",
          name: "Wallet",
          x: 0,
          y: 0,
          column: 2,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
              unique: true,
            },
            { id: "balance", name: "balance", type: "decimal" },
            { id: "currency", name: "currency", type: "string" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "wallet_transactions",
          name: "WalletTransaction",
          x: 0,
          y: 0,
          column: 3,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "walletId",
              name: "walletId",
              type: "string",
              foreignKey: {
                tableName: "wallets",
                columnName: "id",
                reverseRelationName: "transactions",
              },
            },
            {
              id: "paymentId",
              name: "paymentId",
              type: "string",
              foreignKey: { tableName: "payments", columnName: "id" },
              unique: true,
            },
            { id: "type", name: "type", type: "enum" },
            { id: "amount", name: "amount", type: "decimal" },
            { id: "balance", name: "balance", type: "decimal" },
            { id: "description", name: "description", type: "string" },
            { id: "reference", name: "reference", type: "string" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
          ],
        },
        {
          id: "payment_methods",
          name: "PaymentMethod",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            { id: "type", name: "type", type: "enum" },
            { id: "provider", name: "provider", type: "string" },
            { id: "providerId", name: "providerId", type: "string" },
            { id: "isDefault", name: "isDefault", type: "boolean" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "metadata", name: "metadata", type: "json" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "promo_codes",
          name: "PromoCode",
          x: 0,
          y: 0,
          column: 1,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            { id: "code", name: "code", type: "string", unique: true },
            { id: "description", name: "description", type: "string" },
            { id: "type", name: "type", type: "enum" },
            { id: "value", name: "value", type: "decimal" },
            { id: "minAmount", name: "minAmount", type: "decimal" },
            { id: "maxDiscount", name: "maxDiscount", type: "decimal" },
            { id: "usageLimit", name: "usageLimit", type: "integer" },
            { id: "usedCount", name: "usedCount", type: "integer" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "validFrom", name: "validFrom", type: "timestamp" },
            { id: "validUntil", name: "validUntil", type: "timestamp" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "promo_code_usages",
          name: "PromoCodeUsage",
          x: 0,
          y: 0,
          column: 2,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "promoCodeId",
              name: "promoCodeId",
              type: "string",
              foreignKey: {
                tableName: "promo_codes",
                columnName: "id",
                reverseRelationName: "usages",
              },
            },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            {
              id: "paymentId",
              name: "paymentId",
              type: "string",
              foreignKey: { tableName: "payments", columnName: "id" },
            },
            { id: "discount", name: "discount", type: "decimal" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
          ],
        },
      ],
    },
    {
      moduleName: "Product",
      tables: [
        {
          id: "products",
          name: "Product",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            { id: "name", name: "name", type: "string", unique: true },
            { id: "description", name: "description", type: "string" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "product_tags",
          name: "ProductTag",
          x: 0,
          y: 0,
          column: 1,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            { id: "name", name: "name", type: "string", unique: true },
            { id: "description", name: "description", type: "string" },
            { id: "color", name: "color", type: "string" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "product_subtypes",
          name: "ProductSubtype",
          x: 0,
          y: 0,
          column: 2,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "productId",
              name: "productId",
              type: "string",
              foreignKey: {
                tableName: "products",
                columnName: "id",
                reverseRelationName: "sections",
              },
            },
            { id: "name", name: "name", type: "string" },
            { id: "description", name: "description", type: "string" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
      ],
    },
    {
      moduleName: "Subscription",
      tables: [
        {
          id: "package_features",
          name: "PackageFeatures",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            { id: "name", name: "name", type: "string", unique: true },
            { id: "description", name: "description", type: "string" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "subscription_packages",
          name: "SubscriptionPackage",
          x: 0,
          y: 0,
          column: 1,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "productSubtypeId",
              name: "productSubtypeId",
              type: "string",
              foreignKey: {
                tableName: "product_subtypes",
                columnName: "id",
                reverseRelationName: "subscriptionPackages",
              },
            },
            { id: "name", name: "name", type: "string" },
            { id: "description", name: "description", type: "string" },
            { id: "price", name: "price", type: "decimal" },
            { id: "currency", name: "currency", type: "string" },
            { id: "validityDays", name: "validityDays", type: "integer" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "subscription_features",
          name: "SubscriptionFeatures",
          x: 0,
          y: 0,
          column: 2,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "subscriptionPackageId",
              name: "subscriptionPackageId",
              type: "string",
              foreignKey: {
                tableName: "subscription_packages",
                columnName: "id",
              },
            },
            {
              id: "packageFeatureId",
              name: "packageFeatureId",
              type: "string",
              foreignKey: {
                tableName: "package_features",
                columnName: "id",
                reverseRelationName: "subscriptionFeatures",
              },
            },
          ],
        },
        {
          id: "subscriptions",
          name: "Subscription",
          x: 0,
          y: 0,
          column: 3,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            {
              id: "subscriptionPackageId",
              name: "subscriptionPackageId",
              type: "string",
              foreignKey: {
                tableName: "subscription_packages",
                columnName: "id",
              },
            },
            { id: "status", name: "status", type: "enum" },
            { id: "startDate", name: "startDate", type: "timestamp" },
            { id: "endDate", name: "endDate", type: "timestamp" },
            { id: "autoRenew", name: "autoRenew", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
      ],
    },
    {
      moduleName: "Assessment",
      tables: [
        {
          id: "question_papers",
          name: "QuestionPaper",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            { id: "name", name: "name", type: "string" },
            { id: "description", name: "description", type: "string" },
            { id: "type", name: "type", type: "string" },
            { id: "totalQuestions", name: "totalQuestions", type: "integer" },
            { id: "timeLimit", name: "timeLimit", type: "integer" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "question_paper_questions",
          name: "QuestionPaperQuestion",
          x: 0,
          y: 0,
          column: 1,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "questionPaperId",
              name: "questionPaperId",
              type: "string",
              foreignKey: {
                tableName: "question_papers",
                columnName: "id",
                reverseRelationName: "questionPaperQuestions",
              },
            },
            {
              id: "questionId",
              name: "questionId",
              type: "string",
              foreignKey: {
                tableName: "questions",
                columnName: "id",
                reverseRelationName: "question_choices",
              },
            },
            { id: "userAnswer", name: "userAnswer", type: "string" },
            { id: "isCorrect", name: "isCorrect", type: "boolean" },
            { id: "timeSpent", name: "timeSpent", type: "integer" },
            { id: "order", name: "order", type: "integer" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
      ],
    },
    {
      moduleName: "Chat",
      tables: [
        {
          id: "chat_rooms",
          name: "ChatRoom",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            { id: "name", name: "name", type: "string" },
            { id: "type", name: "type", type: "enum" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "chat_participants",
          name: "ChatParticipant",
          x: 0,
          y: 0,
          column: 1,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "chatRoomId",
              name: "chatRoomId",
              type: "string",
              foreignKey: { tableName: "chat_rooms", columnName: "id" },
            },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            { id: "role", name: "role", type: "enum" },
            { id: "joinedAt", name: "joinedAt", type: "timestamp" },
            { id: "leftAt", name: "leftAt", type: "timestamp" },
          ],
        },
        {
          id: "chat_messages",
          name: "ChatMessage",
          x: 0,
          y: 0,
          column: 2,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "chatRoomId",
              name: "chatRoomId",
              type: "string",
              foreignKey: { tableName: "chat_rooms", columnName: "id" },
            },
            {
              id: "senderId",
              name: "senderId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            { id: "content", name: "content", type: "text" },
            { id: "type", name: "type", type: "enum" },
            { id: "metadata", name: "metadata", type: "json" },
            { id: "isEdited", name: "isEdited", type: "boolean" },
            { id: "editedAt", name: "editedAt", type: "timestamp" },
            { id: "isDeleted", name: "isDeleted", type: "boolean" },
            { id: "deletedAt", name: "deletedAt", type: "timestamp" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
          ],
        },
        {
          id: "chat_message_reactions",
          name: "ChatMessageReaction",
          x: 0,
          y: 0,
          column: 3,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "messageId",
              name: "messageId",
              type: "string",
              foreignKey: {
                tableName: "chat_messages",
                columnName: "id",
                reverseRelationName: "reactions",
              },
            },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            { id: "emoji", name: "emoji", type: "string" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
          ],
        },
        {
          id: "chat_read_status",
          name: "ChatReadStatus",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "chatRoomId",
              name: "chatRoomId",
              type: "string",
              foreignKey: { tableName: "chat_rooms", columnName: "id" },
            },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            {
              id: "lastReadMessageId",
              name: "lastReadMessageId",
              type: "string",
            },
            { id: "lastReadAt", name: "lastReadAt", type: "timestamp" },
          ],
        },
      ],
    },
    {
      moduleName: "Notification",
      tables: [
        {
          id: "notifications",
          name: "Notification",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
            },
            { id: "type", name: "type", type: "enum" },
            { id: "title", name: "title", type: "string" },
            { id: "message", name: "message", type: "text" },
            { id: "data", name: "data", type: "json" },
            { id: "isRead", name: "isRead", type: "boolean" },
            { id: "isSent", name: "isSent", type: "boolean" },
            { id: "sentAt", name: "sentAt", type: "timestamp" },
            { id: "readAt", name: "readAt", type: "timestamp" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
          ],
        },
        {
          id: "notification_templates",
          name: "NotificationTemplate",
          x: 0,
          y: 0,
          column: 1,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            { id: "name", name: "name", type: "string", unique: true },
            { id: "type", name: "type", type: "enum" },
            { id: "title", name: "title", type: "string" },
            { id: "message", name: "message", type: "text" },
            { id: "isActive", name: "isActive", type: "boolean" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "notification_preferences",
          name: "NotificationPreference",
          x: 0,
          y: 0,
          column: 2,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            {
              id: "userId",
              name: "userId",
              type: "string",
              foreignKey: { tableName: "users", columnName: "id" },
              unique: true,
            },
            { id: "emailEnabled", name: "emailEnabled", type: "boolean" },
            { id: "smsEnabled", name: "smsEnabled", type: "boolean" },
            { id: "pushEnabled", name: "pushEnabled", type: "boolean" },
            { id: "preferences", name: "preferences", type: "json" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "notification_queue",
          name: "NotificationQueue",
          x: 0,
          y: 0,
          column: 3,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            { id: "userId", name: "userId", type: "string" },
            { id: "type", name: "type", type: "enum" },
            { id: "title", name: "title", type: "string" },
            { id: "message", name: "message", type: "text" },
            { id: "data", name: "data", type: "json" },
            { id: "channel", name: "channel", type: "enum" },
            { id: "status", name: "status", type: "enum" },
            { id: "priority", name: "priority", type: "integer" },
            { id: "attempts", name: "attempts", type: "integer" },
            { id: "maxAttempts", name: "maxAttempts", type: "integer" },
            { id: "scheduledAt", name: "scheduledAt", type: "timestamp" },
            { id: "processedAt", name: "processedAt", type: "timestamp" },
            { id: "failedAt", name: "failedAt", type: "timestamp" },
            { id: "error", name: "error", type: "string" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
            { id: "updatedAt", name: "updatedAt", type: "timestamp" },
          ],
        },
        {
          id: "notification_logs",
          name: "NotificationLog",
          x: 0,
          y: 0,
          column: 0,
          fields: [
            { id: "id", name: "id", type: "string", primaryKey: true },
            { id: "notificationId", name: "notificationId", type: "string" },
            { id: "userId", name: "userId", type: "string" },
            { id: "type", name: "type", type: "enum" },
            { id: "channel", name: "channel", type: "enum" },
            { id: "status", name: "status", type: "enum" },
            { id: "provider", name: "provider", type: "string" },
            { id: "providerId", name: "providerId", type: "string" },
            { id: "error", name: "error", type: "string" },
            { id: "sentAt", name: "sentAt", type: "timestamp" },
            { id: "deliveredAt", name: "deliveredAt", type: "timestamp" },
            { id: "readAt", name: "readAt", type: "timestamp" },
            { id: "createdAt", name: "createdAt", type: "timestamp" },
          ],
        },
      ],
    },
  ],
};

function buildConnections(
  currentTables: Table[],
  allTables: Table[]
): Connection[] {
  const connections: Connection[] = [];

  // Deterministic ordering for numbering
  const allFks: Array<{ tableId: string; fieldId: string }> = [];
  [...allTables].forEach((t) =>
    t.fields.forEach((f) => {
      if (f.foreignKey) allFks.push({ tableId: t.id, fieldId: f.id });
    })
  );
  allFks.sort(
    (a, b) =>
      a.tableId.localeCompare(b.tableId) || a.fieldId.localeCompare(b.fieldId)
  );

  const isTableVisible = new Set(currentTables.map((t) => t.id));

  currentTables.forEach((fromTable) => {
    fromTable.fields.forEach((field) => {
      if (!field.foreignKey) return;
      const targetTable = allTables.find(
        (t) => t.id === field.foreignKey!.tableName
      );
      if (!targetTable || !isTableVisible.has(targetTable.id)) return;

      let toField =
        targetTable.fields.find(
          (f) => f.name === field.foreignKey!.columnName
        ) || targetTable.fields.find((f) => f.primaryKey);

      if (!toField) return;

      const key = `${fromTable.id}-${field.id}`;
      const colorClass =
        relationshipColors[hashToIndex(key, relationshipColors.length)];
      const number =
        allFks.findIndex(
          (fk) => fk.tableId === fromTable.id && fk.fieldId === field.id
        ) + 1;

      connections.push({
        id: `${fromTable.id}:${field.id}->${targetTable.id}:${toField.id}`,
        from: { tableId: fromTable.id, fieldId: field.id },
        to: { tableId: targetTable.id, fieldId: toField.id },
        colorClass,
        number: number > 0 ? number : 0,
      });
    });
  });

  return connections;
}

function AdvDbView() {
  const [data, setData] = useState<ProjectData>(initialData);
  const [selectedModuleIndices, setSelectedModuleIndices] = useState<number[]>([
    0,
  ]);
  const [showBase, setShowBase] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [dragPreviewPosition, setDragPreviewPosition] = useState<Point | null>(
    null
  );
  const [typeSelector, setTypeSelector] = useState<TypeSelector | null>(null);
  const [jsonPanelWidth, setJsonPanelWidth] = useState<number>(400);
  const [tableVisibility, setTableVisibility] = useState<Map<string, boolean>>(
    new Map()
  );
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set(data.modules.map((_, idx) => idx))
  );
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(true);

  const resizeStateRef = useRef<{
    isResizing: boolean;
    startX: number;
    startWidth: number;
  }>({
    isResizing: false,
    startX: 0,
    startWidth: 400,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Wrapper holds both tables and SVG, shares the same transform scale
  const transformWrapperRef = useRef<HTMLDivElement>(null);

  const isTableVisible = (tableId: string): boolean => {
    return tableVisibility.get(tableId) !== false; // Default to true
  };

  const getSelectedTables = (): Table[] => {
    const selectedTables: Table[] = [];
    if (showBase) {
      selectedTables.push(...data.base.filter((t) => isTableVisible(t.id)));
    }
    selectedModuleIndices.forEach((index) => {
      if (data.modules[index]) {
        selectedTables.push(
          ...data.modules[index].tables.filter((t) => isTableVisible(t.id))
        );
      }
    });
    return selectedTables;
  };

  const toggleTableVisibility = (tableId: string) => {
    setTableVisibility((prev) => {
      const next = new Map(prev);
      const current = next.get(tableId) !== false;
      next.set(tableId, !current);
      return next;
    });
  };

  const toggleModuleTables = (moduleIndex: number) => {
    const module = data.modules[moduleIndex];
    if (!module) return;

    // Check if any table in module is hidden
    const hasHidden = module.tables.some(
      (t) => tableVisibility.get(t.id) === false
    );

    // If any hidden, show all; otherwise hide all
    setTableVisibility((prev) => {
      const next = new Map(prev);
      module.tables.forEach((t) => {
        next.set(t.id, hasHidden);
      });
      return next;
    });
  };

  const toggleBaseTables = () => {
    // Check if any base table is hidden
    const hasHidden = data.base.some(
      (t) => tableVisibility.get(t.id) === false
    );

    setTableVisibility((prev) => {
      const next = new Map(prev);
      data.base.forEach((t) => {
        next.set(t.id, hasHidden);
      });
      return next;
    });
  };

  const toggleModuleExpansion = (moduleIndex: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleIndex)) {
        next.delete(moduleIndex);
      } else {
        next.add(moduleIndex);
      }
      return next;
    });
  };

  const currentTables = getSelectedTables();
  const allTables = [...data.base, ...data.modules.flatMap((m) => m.tables)];

  const estimateTableHeight = (table: Table) => {
    const headerHeight = 40;
    const fieldHeight = 28;
    const footerHeight = 48;
    const connectorHeight = 24;
    const bodyHeight = (table.fields.length || 0) * fieldHeight;
    return headerHeight + bodyHeight + footerHeight + connectorHeight;
  };

  const { tablePositions, columnHeights } = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const columnYPositions = new Array(NUM_COLUMNS).fill(COLUMN_START_Y);
    const tablesByColumn: Map<number, Table[]> = new Map();
    for (let col = 0; col < NUM_COLUMNS; col++) tablesByColumn.set(col, []);

    currentTables.forEach((table) => {
      const column = table.column % NUM_COLUMNS;
      tablesByColumn.get(column)!.push(table);
    });

    tablesByColumn.forEach((tables, columnIndex) => {
      let currentY = COLUMN_START_Y;
      const columnX = COLUMN_START_X + columnIndex * COLUMN_WIDTH;

      tables.forEach((table) => {
        const x = table.x !== 0 ? table.x : columnX;
        const y = table.y !== 0 ? table.y : currentY;
        positions.set(table.id, { x, y });

        const tableHeight = estimateTableHeight(table);
        currentY = Math.max(currentY, y + tableHeight + TABLE_VERTICAL_GAP);
      });

      columnYPositions[columnIndex] = currentY;
    });

    return { tablePositions: positions, columnHeights: columnYPositions };
  }, [currentTables]);

  const deleteTable = (tableId: string) => {
    if (showBase) {
      setData({ ...data, base: data.base.filter((t) => t.id !== tableId) });
    } else {
      setData({
        ...data,
        modules: data.modules.map((m) => ({
          ...m,
          tables: m.tables.filter((t) => t.id !== tableId),
        })),
      });
    }
  };

  const addTable = () => {
    // Find shortest column
    const heights = columnHeights;
    let minColumn = 0;
    let minHeight = heights[0] ?? COLUMN_START_Y;
    for (let col = 1; col < NUM_COLUMNS; col++) {
      const height = heights[col] ?? COLUMN_START_Y;
      if (height < minHeight) {
        minHeight = height;
        minColumn = col;
      }
    }

    const newTable: Table = {
      id: `table_${Date.now()}`,
      name: "New Table",
      x: 0,
      y: 0,
      column: minColumn,
      fields: [{ id: "id", name: "ID", type: "uuid", primaryKey: true }],
    };

    if (showBase) {
      setData({ ...data, base: [...data.base, newTable] });
    } else {
      const targetModuleIndex = selectedModuleIndices[0];
      if (targetModuleIndex !== undefined) {
        setData({
          ...data,
          modules: data.modules.map((m, idx) =>
            idx === targetModuleIndex
              ? { ...m, tables: [...m.tables, newTable] }
              : m
          ),
        });
      }
    }
  };

  const addColumn = (tableId: string) => {
    const updateTableFields = (tables: Table[], tableId: string): Table[] =>
      tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              fields: [
                ...t.fields,
                {
                  id: `field_${Date.now()}`,
                  name: "New Field",
                  type: "string",
                },
              ],
            }
          : t
      );

    if (showBase) {
      setData({ ...data, base: updateTableFields(data.base, tableId) });
    } else {
      setData({
        ...data,
        modules: data.modules.map((m) => ({
          ...m,
          tables: updateTableFields(m.tables, tableId),
        })),
      });
    }
  };

  const deleteColumn = (tableId: string, fieldId: string) => {
    const updateTableFields = (tables: Table[], tableId: string): Table[] =>
      tables.map((t) =>
        t.id === tableId
          ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
          : t
      );

    if (showBase) {
      setData({ ...data, base: updateTableFields(data.base, tableId) });
    } else {
      setData({
        ...data,
        modules: data.modules.map((m) => ({
          ...m,
          tables: updateTableFields(m.tables, tableId),
        })),
      });
    }
  };

  const updateField = (
    tableId: string,
    fieldId: string,
    updates: FieldUpdates
  ) => {
    const updateTableFields = (tables: Table[], tableId: string): Table[] =>
      tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              fields: t.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : t
      );

    if (showBase) {
      setData({ ...data, base: updateTableFields(data.base, tableId) });
    } else {
      setData({
        ...data,
        modules: data.modules.map((m) => ({
          ...m,
          tables: updateTableFields(m.tables, tableId),
        })),
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (e.button !== 0) return;
    setDraggingTable(tableId);
    const pos = tablePositions.get(tableId);
    if (pos) {
      setDragOffset({
        x: e.clientX - pos.x * zoom,
        y: e.clientY - pos.y * zoom,
      });
      setDragPreviewPosition(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable) return;
    const newX = (e.clientX - dragOffset.x) / zoom;
    const newY = (e.clientY - dragOffset.y) / zoom;
    setDragPreviewPosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
  };

  const handleMouseUp = () => {
    if (!draggingTable || !dragPreviewPosition) {
      setDraggingTable(null);
      setDragPreviewPosition(null);
      return;
    }

    const determineColumn = (x: number): number => {
      const tableCenterX = x + TABLE_WIDTH / 2;
      for (let col = 0; col < NUM_COLUMNS; col++) {
        const prevBoundary =
          col === 0
            ? -Infinity
            : COLUMN_START_X + (col - 0.5) * COLUMN_WIDTH + TABLE_WIDTH / 2;
        const nextBoundary =
          col === NUM_COLUMNS - 1
            ? Infinity
            : COLUMN_START_X + (col + 0.5) * COLUMN_WIDTH + TABLE_WIDTH / 2;
        if (tableCenterX >= prevBoundary && tableCenterX < nextBoundary)
          return col;
      }
      return NUM_COLUMNS - 1;
    };

    const targetColumn = determineColumn(dragPreviewPosition.x);

    const reorderTables = (tables: Table[]): Table[] => {
      const dragged = tables.find((t) => t.id === draggingTable);
      if (!dragged) return tables;

      const tablesInTarget = tables
        .filter((t) => t.id !== draggingTable && t.column === targetColumn)
        .sort((a, b) => {
          const posA = tablePositions.get(a.id);
          const posB = tablePositions.get(b.id);
          return (posA?.y || 0) - (posB?.y || 0);
        });

      let insertIndex = 0;
      for (let i = 0; i < tablesInTarget.length; i++) {
        const tablePos = tablePositions.get(tablesInTarget[i].id);
        const tableHeight = estimateTableHeight(tablesInTarget[i]);
        const tableMidY = (tablePos?.y || 0) + tableHeight / 2;
        if (dragPreviewPosition.y > tableMidY) insertIndex = i + 1;
      }

      tablesInTarget.splice(insertIndex, 0, dragged);

      const updatedInColumn = tablesInTarget.map((t) => ({
        ...t,
        column: targetColumn,
        x: 0,
        y: 0,
      }));
      const otherTables = tables
        .filter((t) => t.id !== draggingTable && t.column !== targetColumn)
        .map((t) => ({ ...t, x: 0, y: 0 }));

      return [...otherTables, ...updatedInColumn];
    };

    if (showBase) {
      setData({ ...data, base: reorderTables(data.base) });
    } else {
      const dragged = allTables.find((t) => t.id === draggingTable);
      if (dragged) {
        setData({
          ...data,
          modules: data.modules.map((m) =>
            m.tables.some((t) => t.id === draggingTable)
              ? { ...m, tables: reorderTables(m.tables) }
              : m
          ),
        });
      }
    }

    setDraggingTable(null);
    setDragPreviewPosition(null);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStateRef.current = {
      isResizing: true,
      startX: e.clientX,
      startWidth: jsonPanelWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      const isAtLeftEdge = scrollLeft === 0;
      const isAtRightEdge = scrollLeft + clientWidth >= scrollWidth - 1;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if ((isAtLeftEdge && e.deltaX < 0) || (isAtRightEdge && e.deltaX > 0)) {
          e.preventDefault();
        }
      }
    };

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!resizeStateRef.current.isResizing) return;
      const deltaX = resizeStateRef.current.startX - e.clientX;
      const newWidth = resizeStateRef.current.startWidth + deltaX;
      setJsonPanelWidth(Math.max(250, Math.min(800, newWidth)));
    };

    const handleGlobalMouseUp = () => {
      resizeStateRef.current.isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("JSON copied to clipboard!");
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Build connections for visible tables
  const connections = useMemo(
    () => buildConnections(currentTables, allTables),
    [currentTables, allTables]
  );

  // Anchor measurement for SVG overlay
  const [anchorPoints, setAnchorPoints] = useState<Record<AnchorKey, Point>>(
    {} as Record<AnchorKey, Point>
  );
  const measureAnchors = () => {
    const wrapper = transformWrapperRef.current;
    if (!wrapper) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    const nodes = wrapper.querySelectorAll<HTMLElement>("[data-anchor]");
    const next: Record<string, Point> = {};
    nodes.forEach((el) => {
      const key = el.dataset.anchor as AnchorKey;
      const r = el.getBoundingClientRect();
      // Convert viewport coordinates to SVG coordinate space (account for zoom)
      // Since the wrapper is scaled, we need to divide by zoom to get logical coordinates
      const x = (r.left - wrapperRect.left) / zoom;
      const y = (r.top - wrapperRect.top) / zoom;
      next[key] = { x, y };
    });
    setAnchorPoints(next as Record<AnchorKey, Point>);
  };

  // Re-measure on zoom, drag, layout changes, scroll, resize
  useEffect(() => {
    measureAnchors();
  }, [zoom, draggingTable, dragPreviewPosition, currentTables, jsonPanelWidth]);

  useEffect(() => {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    const onScroll = () => {
      requestAnimationFrame(measureAnchors);
    };
    sc.addEventListener("scroll", onScroll);
    return () => sc.removeEventListener("scroll", onScroll);
  }, [zoom]);

  useEffect(() => {
    const wrapper = transformWrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(measureAnchors));
    ro.observe(wrapper);
    window.addEventListener("resize", measureAnchors);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureAnchors);
    };
  }, [zoom]);

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 5px;
          border: 2px solid #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #1f2937;
        }
      `,
        }}
      />
      <div className="bg-gray-950 border-b border-gray-800 p-4 flex-shrink-0 w-full">
        <div className="w-full">
          <div className="mb-4">
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-bold text-white">
                {data.projectName}
              </h1>
              <span className="text-lg font-semibold text-blue-400">
                {currentTables.length}{" "}
                {currentTables.length === 1 ? "table" : "tables"}
              </span>
            </div>
            <p className="text-gray-400 mt-2">{data.description}</p>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setShowBase(!showBase)}
              className={`px-3 py-2 rounded font-medium text-sm transition-all ${
                showBase
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Base Tables
            </button>

            {data.modules.map((module, index) => {
              const isSelected = selectedModuleIndices.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedModuleIndices((prev) =>
                      prev.includes(index)
                        ? prev.filter((i) => i !== index)
                        : [...prev, index]
                    );
                  }}
                  className={`px-3 py-2 rounded font-medium text-sm transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {module.moduleName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toolbar - spans across both canvas and JSON panel */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex gap-3 items-center flex-shrink-0">
        <button
          onClick={addTable}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
        >
          <Plus size={16} /> Add Table
        </button>
        <div className="flex gap-2 items-center ml-auto">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-gray-400 text-sm w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button
            onClick={copyJSON}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            <Copy size={16} /> Copy
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
          >
            <Download size={16} /> Download
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title={showSidebar ? "Hide sidebar" : "Show sidebar"}
          >
            {showSidebar ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeft size={18} />
            )}
          </button>
          <button
            onClick={() => setShowJsonPanel(!showJsonPanel)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title={showJsonPanel ? "Hide JSON panel" : "Show JSON panel"}
          >
            {showJsonPanel ? (
              <PanelRightClose size={18} />
            ) : (
              <PanelRight size={18} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Menu */}
        <div
          className={`bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
            showSidebar ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden"
          }`}
        >
          {showSidebar && (
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                Tables
              </h3>

              {/* Base Tables */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 px-2 py-1.5 rounded bg-gray-800/50">
                  <button
                    onClick={() => setShowBase(!showBase)}
                    className={`flex items-center gap-1 text-base font-normal transition-colors flex-1 text-left ${
                      showBase
                        ? "text-purple-300 hover:text-purple-200"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <span>Base Tables</span>
                  </button>
                  <button
                    onClick={toggleBaseTables}
                    className="p-1 hover:bg-gray-700 rounded transition-opacity"
                    title="Toggle all base tables visibility"
                  >
                    {data.base.some(
                      (t) => tableVisibility.get(t.id) === false
                    ) ? (
                      <EyeOff size={16} className="text-gray-600" />
                    ) : (
                      <Eye size={16} className="text-white" />
                    )}
                  </button>
                </div>
                {showBase && (
                  <div className="ml-2 space-y-1">
                    {data.base.map((table) => {
                      const isVisible = isTableVisible(table.id);
                      return (
                        <div
                          key={table.id}
                          className="flex items-center justify-between group hover:bg-gray-800 rounded px-2 py-1"
                        >
                          <span className="text-xs text-gray-400 truncate flex-1">
                            {table.name}
                          </span>
                          <button
                            onClick={() => toggleTableVisibility(table.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-opacity"
                            title={isVisible ? "Hide table" : "Show table"}
                          >
                            {isVisible ? (
                              <Eye size={14} className="text-white" />
                            ) : (
                              <EyeOff size={14} className="text-gray-600" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modules */}
              <div className="space-y-3">
                {data.modules.map((module, moduleIndex) => {
                  const isExpanded = expandedModules.has(moduleIndex);
                  const isSelected =
                    selectedModuleIndices.includes(moduleIndex);
                  const moduleTables = module.tables;
                  const hasHiddenInModule = moduleTables.some(
                    (t) => tableVisibility.get(t.id) === false
                  );

                  return (
                    <div key={moduleIndex} className="mb-3">
                      <div className="flex items-center justify-between px-2 py-1.5 rounded bg-gray-800/50">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleModuleExpansion(moduleIndex);
                            }}
                            className="p-0.5 hover:bg-gray-700 rounded flex-shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown
                                size={16}
                                className="text-gray-400"
                              />
                            ) : (
                              <ChevronRight
                                size={16}
                                className="text-gray-400"
                              />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModuleIndices((prev) =>
                                prev.includes(moduleIndex)
                                  ? prev.filter((i) => i !== moduleIndex)
                                  : [...prev, moduleIndex]
                              );
                            }}
                            className={`text-left flex-1 text-base font-normal transition-colors truncate ${
                              isSelected
                                ? "text-blue-300 hover:text-blue-200"
                                : "text-gray-400 hover:text-gray-300"
                            }`}
                            title={isSelected ? "Hide module" : "Show module"}
                          >
                            {module.moduleName}
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleModuleTables(moduleIndex);
                          }}
                          className="p-1 hover:bg-gray-700 rounded transition-opacity flex-shrink-0"
                          title="Toggle all module tables visibility"
                        >
                          {hasHiddenInModule ? (
                            <EyeOff size={16} className="text-gray-600" />
                          ) : (
                            <Eye size={16} className="text-white" />
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="ml-4 space-y-1 mt-1.5">
                          {moduleTables.map((table) => {
                            const isVisible = isTableVisible(table.id);
                            return (
                              <div
                                key={table.id}
                                className="flex items-center justify-between group hover:bg-gray-800 rounded px-2 py-1"
                              >
                                <span className="text-xs text-gray-400 truncate flex-1">
                                  {table.name}
                                </span>
                                <button
                                  onClick={() =>
                                    toggleTableVisibility(table.id)
                                  }
                                  className="p-1 hover:bg-gray-700 rounded transition-opacity"
                                  title={
                                    isVisible ? "Hide table" : "Show table"
                                  }
                                >
                                  {isVisible ? (
                                    <Eye size={14} className="text-white" />
                                  ) : (
                                    <EyeOff
                                      size={14}
                                      className="text-gray-600"
                                    />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div
            ref={scrollContainerRef}
            className="flex-1 bg-gray-800 relative overflow-auto cursor-move custom-scrollbar"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Shared transform wrapper for tables and SVG */}
            <div
              ref={transformWrapperRef}
              className="relative"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "0 0",
                minWidth: `${CANVAS_WIDTH}px`,
                minHeight: `${CANVAS_HEIGHT}px`,
              }}
            >
              {/* SVG connections overlay */}
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
              >
                <defs>
                  {relationshipColors.map((colorClass, idx) => {
                    const color = tailwindToHex[colorClass] || "#64748b";
                    return (
                      <marker
                        key={colorClass}
                        id={`arrow-${idx}`}
                        markerWidth="12"
                        markerHeight="12"
                        refX="0"
                        refY="6"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <path
                          d="M12,0 L0,6 L12,12 z"
                          fill={color}
                          stroke="none"
                        />
                      </marker>
                    );
                  })}
                </defs>

                {connections.map((c) => {
                  const from =
                    anchorPoints[
                      `${c.from.tableId}:${c.from.fieldId}:left` as AnchorKey
                    ];
                  const to =
                    anchorPoints[
                      `${c.to.tableId}:${c.to.fieldId}:right` as AnchorKey
                    ];
                  if (!from || !to) return null;

                  const dx = Math.max(40, Math.abs(to.x - from.x) * 0.4);
                  // Calculate initial direction angle based on curve approach
                  // Make first control point follow the general curve direction
                  const dyInitial = (to.y - from.y) * 0.1; // Slight vertical component
                  const control1X = (from.x - dx) / 1.2;
                  const control1Y = from.y + dyInitial;

                  const d = `M ${from.x},${
                    from.y
                  } C ${control1X},${control1Y} ${to.x + dx},${to.y} ${to.x},${
                    to.y
                  }`;
                  const stroke = tailwindToHex[c.colorClass] || "#64748b";
                  const arrowId = `arrow-${relationshipColors.indexOf(
                    c.colorClass
                  )}`;

                  return (
                    <g key={c.id}>
                      <path
                        d={d}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={2}
                        markerStart={`url(#${arrowId})`}
                      />
                      {/* Optional relationship label midway */}
                      <text
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 6}
                        fontSize="9"
                        fontWeight={700}
                        textAnchor="middle"
                        fill="#e5e7eb"
                        stroke="#111827"
                        strokeWidth="0.5"
                      >
                        {c.number}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tables */}
              {currentTables.map((table) => {
                const position =
                  draggingTable === table.id && dragPreviewPosition
                    ? dragPreviewPosition
                    : tablePositions.get(table.id) ?? {
                        x: COLUMN_START_X,
                        y: COLUMN_START_Y,
                      };

                return (
                  <div
                    key={table.id}
                    style={{
                      position: "absolute",
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                      width: "240px",
                      opacity: draggingTable === table.id ? 0.7 : 1,
                      zIndex: draggingTable === table.id ? 1000 : "auto",
                    }}
                    className={`rounded-lg shadow-xl border-2 border-gray-300 hover:border-blue-500 transition-colors ${
                      getTableColor(table.id).body
                    }`}
                  >
                    <div
                      onMouseDown={(e) => handleMouseDown(e, table.id)}
                      style={{
                        cursor:
                          draggingTable === table.id ? "grabbing" : "grab",
                      }}
                      className={`bg-gradient-to-r ${
                        getTableColor(table.id).header
                      } text-white p-2 rounded-t-md`}
                    >
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        <input
                          type="text"
                          value={table.name}
                          onChange={(e) => {
                            e.stopPropagation();
                            const updateTableName = (
                              tables: Table[],
                              tableId: string,
                              name: string
                            ): Table[] =>
                              tables.map((t) =>
                                t.id === tableId ? { ...t, name } : t
                              );

                            if (showBase) {
                              setData({
                                ...data,
                                base: updateTableName(
                                  data.base,
                                  table.id,
                                  e.target.value
                                ),
                              });
                            } else {
                              setData({
                                ...data,
                                modules: data.modules.map((m) => ({
                                  ...m,
                                  tables: updateTableName(
                                    m.tables,
                                    table.id,
                                    e.target.value
                                  ),
                                })),
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="font-bold text-xs leading-tight bg-transparent outline-none text-white placeholder-gray-200 w-auto min-w-0 px-1 rounded hover:bg-blue-500 focus:bg-blue-500"
                          style={{
                            width: `${Math.max(table.name.length + 1, 8)}ch`,
                          }}
                          placeholder="Table name"
                          title={table.name}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTable(table.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-red-600 rounded transition-colors opacity-80 hover:opacity-100 flex-shrink-0"
                          title="Delete table"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      {table.fields.map((field) => (
                        <div
                          key={field.id}
                          className="py-1 px-0.5 text-xs hover:bg-gray-50 flex items-center justify-between gap-1 group min-w-0 relative border-b-2 border-gray-300 last:border-b-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Invisible anchors for SVG measurement */}
                          <span
                            data-anchor={`${table.id}:${field.id}:left`}
                            className="absolute top-1/2 left-0 -translate-y-1/2 w-0 h-0"
                          />
                          <span
                            data-anchor={`${table.id}:${field.id}:right`}
                            className="absolute top-1/2 right-0 -translate-y-1/2 w-0 h-0"
                          />

                          <div className="flex-1 min-w-0 flex items-center gap-0.5">
                            <div className="flex items-center gap-1 mb-0.5 min-w-0 flex-1">
                              {field.primaryKey && (
                                <span className="text-yellow-600 font-bold flex-shrink-0">
                                  🔑
                                </span>
                              )}
                              {field.foreignKey && (
                                <span className="text-purple-600 font-bold flex-shrink-0">
                                  🔗
                                </span>
                              )}
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) =>
                                  updateField(table.id, field.id, {
                                    name: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") e.currentTarget.blur();
                                }}
                                className="font-medium text-gray-800 bg-transparent outline-none text-xs px-1 rounded flex-1 min-w-0 hover:bg-gray-200 focus:bg-gray-200 truncate"
                                title={field.name}
                              />
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  setTypeSelector({
                                    tableId: table.id,
                                    fieldId: field.id,
                                    x: rect.left,
                                    y: rect.top,
                                  });
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1 py-0.5 rounded hover:bg-blue-50 flex-shrink-0 whitespace-nowrap"
                                title={field.type}
                              >
                                {field.type}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteColumn(table.id, field.id);
                                }}
                                className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-all text-red-600 flex-shrink-0"
                                title="Delete field"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Decorative small connectors */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-px bg-gray-400 -translate-x-[120%]" />
                            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-px bg-gray-400 translate-x-[120%]" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addColumn(table.id);
                      }}
                      className="w-full text-blue-600 hover:text-blue-700 font-medium text-xs py-0.25 border-t border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      + Column
                    </button>
                  </div>
                );
              })}
            </div>

            {currentTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div className="text-gray-500">
                  <p className="text-lg mb-4">
                    {!showBase && selectedModuleIndices.length === 0
                      ? "No modules or base selected. Click a button above to view tables."
                      : showBase && selectedModuleIndices.length === 0
                      ? "No tables in base"
                      : !showBase && selectedModuleIndices.length > 0
                      ? "No tables in selected modules"
                      : "No tables in base or selected modules"}
                  </p>
                  {(showBase || selectedModuleIndices.length > 0) && (
                    <button
                      onClick={addTable}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={18} /> Create First Table
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {showJsonPanel && (
          <div
            className="w-1 bg-gray-700 hover:bg-blue-600 cursor-col-resize transition-colors flex-shrink-0 relative group"
            onMouseDown={handleResizeStart}
            style={{ cursor: "col-resize" }}
          >
            <div className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-transparent group-hover:bg-blue-400/20 transition-colors" />
          </div>
        )}

        <div
          className={`bg-gray-950 border-l border-gray-800 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${
            showJsonPanel ? "opacity-100" : "w-0 opacity-0 overflow-hidden"
          }`}
          style={
            showJsonPanel ? { width: `${jsonPanelWidth}px` } : { width: "0px" }
          }
        >
          {showJsonPanel && (
            <>
              <div className="bg-gray-900 p-2 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
                <h3 className="text-sm font-bold text-white">
                  JSON Configuration
                </h3>
              </div>
              <pre className="flex-1 bg-gray-900 text-green-400 p-3 overflow-auto text-xs font-mono custom-scrollbar">
                {JSON.stringify(data, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>

      {typeSelector && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-0 z-40"
            onClick={() => setTypeSelector(null)}
          />
          <div
            className="fixed bg-white rounded-lg shadow-2xl z-50 border border-gray-300 overflow-hidden"
            style={{
              left: `${typeSelector.x}px`,
              top: `${typeSelector.y}px`,
              minWidth: "150px",
            }}
          >
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
              <p className="text-xs font-semibold text-gray-700">Select Type</p>
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {[
                "uuid",
                "string",
                "text",
                "integer",
                "decimal",
                "boolean",
                "timestamp",
                "date",
                "json",
                "enum",
              ].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    updateField(typeSelector.tableId, typeSelector.fieldId, {
                      type,
                    });
                    setTypeSelector(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-900 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdvDbView;
