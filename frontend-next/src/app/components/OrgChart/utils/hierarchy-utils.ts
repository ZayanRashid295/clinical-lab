import {
  OrgChartNode,
  FlatNode,
} from "@/app/components/OrgChart/org-chart-types/org-chart-model";

// Flatten hierarchical structure to flat nodes with parentId and level
export function flattenHierarchy(
  nodes: OrgChartNode[],
  parentId?: string,
  level: number = 0
): FlatNode[] {
  const flatNodes: FlatNode[] = [];
  nodes.forEach((node) => {
    const flatNode: FlatNode = {
      id: node.id,
      role: node.role,
      name: node.name,
      parentId,
      level,
    };
    flatNodes.push(flatNode);
    if (node.children && node.children.length > 0) {
      const childNodes = flattenHierarchy(node.children, node.id, level + 1);
      flatNodes.push(...childNodes);
    }
  });
  return flatNodes;
}

// Build hierarchy map from flat nodes
export function buildHierarchyMap(
  flatNodes: FlatNode[]
): Map<string, FlatNode[]> {
  const hierarchy = new Map<string, FlatNode[]>();
  flatNodes.forEach((node) => {
    const parentId = node.parentId || "root";
    if (!hierarchy.has(parentId)) {
      hierarchy.set(parentId, []);
    }
    hierarchy.get(parentId)!.push(node);
  });
  return hierarchy;
}

// Function to find node in hierarchy
export function findNodeInHierarchy(
  nodes: OrgChartNode[],
  nodeId: string
): OrgChartNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children) {
      const found = findNodeInHierarchy(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

// Function to find parent of a node
export function findParent(
  nodes: OrgChartNode[],
  childId: string,
  parent: OrgChartNode | null = null
): OrgChartNode | null {
  for (const node of nodes) {
    if (node.id === childId) return parent;
    if (node.children) {
      const found = findParent(node.children, childId, node);
      if (found !== null) return found;
    }
  }
  return null;
}

// Function to find path to a node
export function findNodePath(
  nodes: OrgChartNode[],
  targetId: string,
  path: Array<{ array: OrgChartNode[]; index: number }> = []
): Array<{ array: OrgChartNode[]; index: number }> | null {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;
    if (node.id === targetId) {
      return [...path, { array: nodes, index: i }];
    }
    if (node.children && node.children.length > 0) {
      const found = findNodePath(node.children, targetId, [
        ...path,
        { array: nodes, index: i },
      ]);
      if (found) return found;
    }
  }
  return null;
}

// Function to create a new array structure (ensures React detects changes)
export function createNewArrayStructure(nodes: OrgChartNode[]): OrgChartNode[] {
  return nodes.map((node) => {
    const newNode = { ...node };
    if (node.children && node.children.length > 0) {
      newNode.children = createNewArrayStructure(node.children);
    }
    return newNode;
  });
}

// Check if a node is a descendant of another
export function isDescendant(
  nodes: OrgChartNode[],
  ancestorId: string,
  descendantId: string
): boolean {
  const ancestor = findNodeInHierarchy(nodes, ancestorId);
  if (!ancestor || !ancestor.children) return false;
  if (ancestor.children.some((child) => child.id === descendantId)) return true;
  return ancestor.children.some((child) =>
    isDescendant(nodes, child.id, descendantId)
  );
}
