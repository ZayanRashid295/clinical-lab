interface OrgChartNode {
  id: string;
  role: string;
  name: string;
  parentId?: string;
  x?: number;
  y?: number;
  level?: number;
}

interface OrgChartData {
  organizationName: string;
  description: string;
  nodes: OrgChartNode[];
}

type Point = { x: number; y: number };

type Connection = {
  id: string;
  from: string;
  to: string;
};

export type { OrgChartNode, OrgChartData, Point, Connection };

