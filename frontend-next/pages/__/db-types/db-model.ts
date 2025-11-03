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

export type {
  ForeignKeyInfo,
  Field,
  Table,
  Module,
  ProjectData,
  TypeSelector,
  FieldUpdates,
  AnchorSide,
  AnchorKey,
  Point,
  Connection,
};
