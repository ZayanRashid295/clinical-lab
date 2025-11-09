interface OrgChartNode {
  id: string;
  role: string;
  name: string;
  children?: OrgChartNode[];
}

interface OrgChartData {
  organizationName: string;
  description: string;
  hierarchy: OrgChartNode[];
}

type Point = { x: number; y: number };

type Connection = {
  id: string;
  from: string;
  to: string;
};

type FlatNode = {
  id: string;
  role: string;
  name: string;
  parentId?: string;
  level: number;
};

export type { OrgChartNode, OrgChartData, Point, Connection, FlatNode };

