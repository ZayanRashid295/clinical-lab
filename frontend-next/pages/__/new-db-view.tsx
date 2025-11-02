import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Download,
  Edit2,
  ZoomIn,
  ZoomOut,
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
  column: number; // Which column this table belongs to (0-3)
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

const ModuleManager = () => {
  // Color palette for table headers and backgrounds
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

  // Colors for relationship connections
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

  // Get color for a relationship based on the foreign key field
  const getRelationshipColor = (fromTableId: string, fromFieldId: string) => {
    const key = `${fromTableId}-${fromFieldId}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % relationshipColors.length;
    return relationshipColors[index];
  };

  // Get color for a primary key field by finding its referencing foreign key
  const getRelationshipColorForPrimaryKey = (
    tableId: string,
    fieldId: string
  ) => {
    // Find all foreign keys that reference this primary key
    const allTables = [...data.base, ...data.modules.flatMap((m) => m.tables)];

    for (const table of allTables) {
      for (const field of table.fields) {
        if (
          field.foreignKey &&
          field.foreignKey.tableName === tableId &&
          field.foreignKey.columnName === fieldId
        ) {
          // Found a foreign key that references this primary key
          return getRelationshipColor(table.id, field.id);
        }
      }
    }

    // Fallback if no foreign key found
    return "bg-gray-400";
  };

  // Get color for a table based on a stable hash of its ID (so color doesn't change when reordering)
  const getTableColor = (tableId: string) => {
    let hash = 0;
    for (let i = 0; i < tableId.length; i++) {
      hash = (hash << 5) - hash + tableId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % tableColors.length;
    return tableColors[index];
  };

  // Column-based positioning constants
  const NUM_COLUMNS = 4;
  const COLUMN_WIDTH = 350; // Space between column starts
  const COLUMN_START_X = 50;
  const COLUMN_START_Y = 50;
  const TABLE_VERTICAL_GAP = 40; // Gap between tables in a column

  // Helper to assign column to a table based on its index
  const getColumnForIndex = (index: number) => index % NUM_COLUMNS;

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
        id: "role_permissions",
        name: "RolePermission",
        x: 0,
        y: 0,
        column: 2,
        fields: [
          { id: "id", name: "id", type: "string", primaryKey: true },
          {
            id: "roleId",
            name: "roleId",
            type: "string",
            foreignKey: {
              tableName: "roles",
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
              reverseRelationName: "roles",
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "payments",
                  columnName: "id",
                },
              },
              { id: "amount", name: "amount", type: "decimal" },
              { id: "reason", name: "reason", type: "string" },
              { id: "status", name: "status", type: "enum" },
              {
                id: "gatewayRefundId",
                name: "gatewayRefundId",
                type: "string",
              },
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "payments",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
              },
              {
                id: "paymentId",
                name: "paymentId",
                type: "string",
                foreignKey: {
                  tableName: "payments",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "chat_rooms",
                  columnName: "id",
                },
              },
              {
                id: "userId",
                name: "userId",
                type: "string",
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "chat_rooms",
                  columnName: "id",
                },
              },
              {
                id: "senderId",
                name: "senderId",
                type: "string",
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "chat_rooms",
                  columnName: "id",
                },
              },
              {
                id: "userId",
                name: "userId",
                type: "string",
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
                foreignKey: {
                  tableName: "users",
                  columnName: "id",
                },
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
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [typeSelector, setTypeSelector] = useState<TypeSelector | null>(null);
  const [jsonPanelWidth, setJsonPanelWidth] = useState<number>(400);
  const resizeStateRef = useRef<{
    isResizing: boolean;
    startX: number;
    startWidth: number;
  }>({ isResizing: false, startX: 0, startWidth: 400 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Combine tables from all selected modules
  const getSelectedTables = (): Table[] => {
    if (showBase) {
      return data.base;
    }

    const selectedTables: Table[] = [];
    selectedModuleIndices.forEach((index) => {
      if (data.modules[index]) {
        selectedTables.push(...data.modules[index].tables);
      }
    });
    return selectedTables;
  };

  const currentTables = getSelectedTables();
  const allTables = [...data.base, ...data.modules.flatMap((m) => m.tables)];

  const estimateTableHeight = (table: Table) => {
    const headerHeight = 40;
    const fieldHeight = 28; // Includes padding and borders
    const footerHeight = 48; // Buttons and padding at bottom
    const connectorHeight = 24; // Space for connector indicators
    const fieldCount = table.fields.length;
    const bodyHeight = fieldCount > 0 ? fieldCount * fieldHeight : 0;
    return headerHeight + bodyHeight + footerHeight + connectorHeight;
  };

  // Column-based positioning system
  const tablePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();

    // Track the current Y position for each column
    const columnYPositions = new Array(NUM_COLUMNS).fill(COLUMN_START_Y);

    // Group tables by column
    const tablesByColumn: Map<number, Table[]> = new Map();
    for (let col = 0; col < NUM_COLUMNS; col++) {
      tablesByColumn.set(col, []);
    }

    currentTables.forEach((table) => {
      const column = table.column % NUM_COLUMNS; // Ensure column is within bounds
      tablesByColumn.get(column)?.push(table);
    });

    // Position tables within each column
    tablesByColumn.forEach((tables, columnIndex) => {
      let currentY = COLUMN_START_Y;
      const columnX = COLUMN_START_X + columnIndex * COLUMN_WIDTH;

      tables.forEach((table) => {
        // Use stored x,y if they differ from default, otherwise calculate from column
        const x = table.x !== 0 ? table.x : columnX;
        const y = table.y !== 0 ? table.y : currentY;

        positions.set(table.id, { x, y });

        // Update the column's Y position for the next table
        const tableHeight = estimateTableHeight(table);
        currentY = Math.max(currentY, y + tableHeight + TABLE_VERTICAL_GAP);
      });

      columnYPositions[columnIndex] = currentY;
    });

    return positions;
  }, [currentTables]);

  const findTableById = (id: string): Table | undefined =>
    allTables.find((t) => t.id === id);

  // Get field-level connections for a table
  const getFieldConnections = (table: Table) => {
    const connections: Array<{
      fromTable: Table;
      fromField: Field & { foreignKey: ForeignKeyInfo };
      toTable: Table;
      toField: Field;
      fromFieldIndex: number;
      toFieldIndex: number;
    }> = [];

    table.fields.forEach((field, fieldIndex) => {
      if (field.foreignKey) {
        const foreignKey = field.foreignKey;
        const toTable = findTableById(foreignKey.tableName);
        if (toTable && currentTables.find((t) => t.id === toTable.id)) {
          // Find the target field - prefer exact name match, then primary key
          let toField = toTable.fields.find(
            (f) => f.name === foreignKey.columnName
          );
          if (!toField) {
            toField = toTable.fields.find((f) => f.primaryKey);
          }

          if (toField) {
            const toFieldIndex = toTable.fields.indexOf(toField);
            connections.push({
              fromTable: table,
              fromField: field as Field & { foreignKey: ForeignKeyInfo },
              toTable,
              toField,
              fromFieldIndex: fieldIndex,
              toFieldIndex,
            });
          }
        }
      }
    });

    return connections;
  };

  // Calculate field position within a table
  const getFieldPosition = (table: Table, fieldIndex: number) => {
    // Get the table's current position (use stored position if dragged, otherwise dynamic)
    const tablePosition = tablePositions.get(table.id) ?? {
      x: COLUMN_START_X,
      y: COLUMN_START_Y,
    };

    const tableHeaderHeight = 36; // Header height with padding
    const fieldHeight = 20; // Actual field height (py-1 = 4px * 2 + content)
    const fieldVerticalGap = 8; // Gap between fields (border-b-2 = 2px + py-1 spacing)

    // Calculate Y position: table top + header + field index * (field height + gap) + field center
    const fieldY =
      tablePosition.y +
      tableHeaderHeight +
      fieldIndex * (fieldHeight + fieldVerticalGap) +
      fieldHeight / 2;

    // Determine if this field has a foreign key
    const field = table.fields[fieldIndex];
    const isForeignKey = field?.foreignKey;

    // Position based on field type: FK fields connect from left edge, PK fields from right edge
    const fieldX = isForeignKey ? tablePosition.x : tablePosition.x + 240; // Left edge for FK, right edge for PK

    return { x: fieldX, y: fieldY };
  };

  // Convert Tailwind color classes to canvas colors
  const tailwindToCanvasColor = (tailwindClass: string) => {
    const colorMap: { [key: string]: string } = {
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
    return colorMap[tailwindClass] || "#64748b";
  };

  const drawConnections = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // No connection lines drawn
  };

  useEffect(() => {
    drawConnections();
  }, [currentTables, zoom]);

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

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (e.button !== 0) return;
    setDraggingTable(tableId);
    const tablePosition = tablePositions.get(tableId);
    if (tablePosition) {
      setDragOffset({
        x: e.clientX - tablePosition.x * zoom,
        y: e.clientY - tablePosition.y * zoom,
      });
      setDragPreviewPosition(tablePosition);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable) return;

    const newX = (e.clientX - dragOffset.x) / zoom;
    const newY = (e.clientY - dragOffset.y) / zoom;

    // Update preview position
    setDragPreviewPosition({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
    });
  };

  const handleMouseUp = () => {
    if (!draggingTable || !dragPreviewPosition) {
      setDraggingTable(null);
      setDragPreviewPosition(null);
      return;
    }

    // Determine which column based on table center position
    // Column boundaries are at the middle line between columns
    const determineColumn = (x: number): number => {
      const tableWidth = 240;
      const tableCenterX = x + tableWidth / 2;

      for (let col = 0; col < NUM_COLUMNS; col++) {
        const prevBoundary =
          col === 0
            ? -Infinity
            : COLUMN_START_X + (col - 0.5) * COLUMN_WIDTH + tableWidth / 2;
        const nextBoundary =
          col === NUM_COLUMNS - 1
            ? Infinity
            : COLUMN_START_X + (col + 0.5) * COLUMN_WIDTH + tableWidth / 2;

        if (tableCenterX >= prevBoundary && tableCenterX < nextBoundary) {
          return col;
        }
      }
      return NUM_COLUMNS - 1;
    };

    const targetColumn = determineColumn(dragPreviewPosition.x);

    // Reorder tables: move dragged table to the correct position in the target column
    const reorderTables = (tables: Table[]): Table[] => {
      const draggedTable = tables.find((t) => t.id === draggingTable);
      if (!draggedTable) return tables;

      // Get all tables in the target column (excluding the dragged table)
      const tablesInTargetColumn = tables
        .filter((t) => t.id !== draggingTable && t.column === targetColumn)
        .sort((a, b) => {
          const posA = tablePositions.get(a.id);
          const posB = tablePositions.get(b.id);
          return (posA?.y || 0) - (posB?.y || 0);
        });

      // Find insertion position based on Y coordinate
      // Consider the middle of each table for better insertion logic
      let insertIndex = 0;
      for (let i = 0; i < tablesInTargetColumn.length; i++) {
        const tablePos = tablePositions.get(tablesInTargetColumn[i].id);
        const tableHeight = estimateTableHeight(tablesInTargetColumn[i]);
        const tableMidY = (tablePos?.y || 0) + tableHeight / 2;

        if (dragPreviewPosition.y > tableMidY) {
          insertIndex = i + 1;
        }
      }

      // Insert the dragged table at the correct position
      tablesInTargetColumn.splice(insertIndex, 0, draggedTable);

      // Update all tables: reset x,y to 0 for column positioning, update column assignment
      const updatedTablesInColumn = tablesInTargetColumn.map((t, idx) => ({
        ...t,
        column: targetColumn,
        x: 0,
        y: 0,
      }));

      // Combine with tables from other columns
      const otherTables = tables
        .filter((t) => t.id !== draggingTable && t.column !== targetColumn)
        .map((t) => ({ ...t, x: 0, y: 0 }));

      return [...otherTables, ...updatedTablesInColumn];
    };

    if (showBase) {
      setData({
        ...data,
        base: reorderTables(data.base),
      });
    } else {
      // Find which module contains the dragged table and reorder it there
      const draggedTable = allTables.find((t) => t.id === draggingTable);
      if (draggedTable) {
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

  const addTable = () => {
    const newTableId = `table_${Date.now()}`;
    // Determine the column for the new table based on the current number of tables
    const currentTableCount = currentTables.length;
    const assignedColumn = getColumnForIndex(currentTableCount);

    const newTable: Table = {
      id: newTableId,
      name: "New Table",
      x: 0, // Will be calculated by column positioning
      y: 0, // Will be calculated by column positioning
      column: assignedColumn,
      fields: [{ id: "id", name: "ID", type: "uuid", primaryKey: true }],
    };

    if (showBase) {
      setData({
        ...data,
        base: [...data.base, newTable],
      });
    } else {
      // Add to the first selected module
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

  const deleteTable = (tableId: string) => {
    if (showBase) {
      setData({
        ...data,
        base: data.base.filter((t) => t.id !== tableId),
      });
    } else {
      // Find and delete from any module
      setData({
        ...data,
        modules: data.modules.map((m) => ({
          ...m,
          tables: m.tables.filter((t) => t.id !== tableId),
        })),
      });
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
      setData({
        ...data,
        base: updateTableFields(data.base, tableId),
      });
    } else {
      // Update in any module that contains this table
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
      setData({
        ...data,
        base: updateTableFields(data.base, tableId),
      });
    } else {
      // Update in any module that contains this table
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
      setData({
        ...data,
        base: updateTableFields(data.base, tableId),
      });
    } else {
      // Update in any module that contains this table
      setData({
        ...data,
        modules: data.modules.map((m) => ({
          ...m,
          tables: updateTableFields(m.tables, tableId),
        })),
      });
    }
  };

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

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">
              {data.projectName}
            </h1>
            <p className="text-gray-400">{data.description}</p>
          </div>

          {/* Module Selector */}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => {
                setShowBase(!showBase);
                if (!showBase) {
                  // When turning on base, turn off all modules
                  setSelectedModuleIndices([]);
                }
              }}
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
                    setShowBase(false);
                    setSelectedModuleIndices((prev) => {
                      if (prev.includes(index)) {
                        // Remove from selection
                        return prev.filter((i) => i !== index);
                      } else {
                        // Add to selection
                        return [...prev, index];
                      }
                    });
                  }}
                  className={`px-3 py-2 rounded font-medium text-sm transition-all ${
                    !showBase && isSelected
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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ minWidth: 0 }}
        >
          {/* Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 flex gap-3 items-center">
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
              <div className="w-px h-6 bg-gray-600 mx-2"></div>
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
            </div>
          </div>

          {/* Canvas */}
          <div
            className="flex-1 bg-gray-800 relative overflow-hidden cursor-move"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={2500}
              height={1600}
              className="absolute top-0 left-0 pointer-events-none"
            />

            {/* Column guides (visible when dragging) */}
            {draggingTable && dragPreviewPosition && (
              <div
                style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
              >
                {/* Column areas */}
                {Array.from({ length: NUM_COLUMNS }).map((_, colIndex) => {
                  // Calculate table center position
                  const tableWidth = 240;
                  const tableCenterX = dragPreviewPosition.x + tableWidth / 2;

                  // Column boundaries are at the middle line between columns
                  const prevBoundary =
                    colIndex === 0
                      ? -Infinity
                      : COLUMN_START_X +
                        (colIndex - 0.5) * COLUMN_WIDTH +
                        tableWidth / 2;
                  const nextBoundary =
                    colIndex === NUM_COLUMNS - 1
                      ? Infinity
                      : COLUMN_START_X +
                        (colIndex + 0.5) * COLUMN_WIDTH +
                        tableWidth / 2;

                  const isTargetColumn =
                    tableCenterX >= prevBoundary && tableCenterX < nextBoundary;

                  return (
                    <div
                      key={`column-guide-${colIndex}`}
                      style={{
                        position: "absolute",
                        left: `${COLUMN_START_X + colIndex * COLUMN_WIDTH}px`,
                        top: `${COLUMN_START_Y}px`,
                        width: "240px",
                        height: "2000px",
                        backgroundColor: isTargetColumn
                          ? "rgba(59, 130, 246, 0.25)"
                          : "rgba(59, 130, 246, 0.08)",
                        border: isTargetColumn
                          ? "3px solid rgba(59, 130, 246, 0.6)"
                          : "2px dashed rgba(59, 130, 246, 0.25)",
                        pointerEvents: "none",
                        transition: "all 0.15s ease",
                      }}
                    />
                  );
                })}

                {/* Middle line separators between columns */}
                {Array.from({ length: NUM_COLUMNS - 1 }).map(
                  (_, separatorIndex) => {
                    const tableWidth = 240;
                    const separatorX =
                      COLUMN_START_X +
                      (separatorIndex + 0.5) * COLUMN_WIDTH +
                      tableWidth / 2;

                    return (
                      <div
                        key={`separator-${separatorIndex}`}
                        style={{
                          position: "absolute",
                          left: `${separatorX}px`,
                          top: `${COLUMN_START_Y}px`,
                          width: "2px",
                          height: "2000px",
                          backgroundColor: "rgba(239, 68, 68, 0.4)",
                          pointerEvents: "none",
                        }}
                      />
                    );
                  }
                )}
              </div>
            )}

            {/* Tables */}
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
            >
              {currentTables.map((table) => {
                const position = tablePositions.get(table.id) ?? {
                  x: COLUMN_START_X,
                  y: COLUMN_START_Y,
                };

                // Use drag preview position if this table is being dragged
                const displayPosition =
                  draggingTable === table.id && dragPreviewPosition
                    ? dragPreviewPosition
                    : position;

                return (
                  <div
                    key={table.id}
                    onMouseDown={(e) => handleMouseDown(e, table.id)}
                    style={{
                      position: "absolute",
                      left: `${displayPosition.x}px`,
                      top: `${displayPosition.y}px`,
                      width: "240px",
                      cursor: draggingTable === table.id ? "grabbing" : "grab",
                      opacity: draggingTable === table.id ? 0.7 : 1,
                      zIndex: draggingTable === table.id ? 1000 : "auto",
                    }}
                    className={`rounded-lg shadow-xl border-2 border-gray-300 hover:border-blue-500 transition-colors ${
                      getTableColor(table.id).body
                    }`}
                  >
                    {/* Table Header */}
                    <div
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
                              // Update in any module that contains this table
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
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
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
                          className="p-1 hover:bg-red-600 rounded transition-colors opacity-80 hover:opacity-100 flex-shrink-0"
                          title="Delete table"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="relative">
                      {table.fields.map((field, fieldIndex) => (
                        <div
                          key={field.id}
                          className="py-1 px-0.5 text-xs hover:bg-gray-50 flex items-center justify-between gap-1 group min-w-0 relative border-b-2 border-gray-300 last:border-b-0"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  }
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

                          {/* Small connector lines outside table */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-px bg-gray-400 -translate-x-[120%]" />
                            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-px bg-gray-400 translate-x-[120%]" />
                            {field.foreignKey && (
                              <>
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full border border-white -translate-x-[280%] -translate-y-1/2 ${getRelationshipColor(
                                    table.id,
                                    field.id
                                  )}`}
                                />
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full border border-white translate-x-[280%] -translate-y-1/2 ${getRelationshipColor(
                                    table.id,
                                    field.id
                                  )}`}
                                />
                              </>
                            )}
                            {field.primaryKey && (
                              <>
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full border border-white -translate-x-[280%] -translate-y-1/2 ${getRelationshipColorForPrimaryKey(
                                    table.id,
                                    field.id
                                  )}`}
                                />
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full border border-white translate-x-[280%] -translate-y-1/2 ${getRelationshipColorForPrimaryKey(
                                    table.id,
                                    field.id
                                  )}`}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Field Button */}
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
                    {showBase
                      ? "No tables in base"
                      : selectedModuleIndices.length === 0
                      ? "No modules selected"
                      : "No tables in selected modules"}
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

        {/* Resizable Divider */}
        <div
          className="w-1 bg-gray-700 hover:bg-blue-600 cursor-col-resize transition-colors flex-shrink-0 relative group"
          onMouseDown={handleResizeStart}
          style={{ cursor: "col-resize" }}
        >
          <div className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-transparent group-hover:bg-blue-400/20 transition-colors" />
        </div>

        {/* JSON Panel */}
        <div
          className="bg-gray-950 border-l border-gray-800 overflow-hidden flex flex-col flex-shrink-0"
          style={{ width: `${jsonPanelWidth}px` }}
        >
          <div className="bg-gray-900 p-2 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">JSON Configuration</h3>
          </div>
          <pre className="flex-1 bg-gray-900 text-green-400 p-3 overflow-auto text-xs font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>

      {/* Type Selector Modal */}
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
            <div className="max-h-64 overflow-y-auto">
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
};

export default ModuleManager;
