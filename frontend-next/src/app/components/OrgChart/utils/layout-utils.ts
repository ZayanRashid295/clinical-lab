import {
  FlatNode,
  Connection,
} from "@/app/components/OrgChart/org-chart-types/org-chart-model";
import {
  NODE_WIDTH_VERTICAL,
  NODE_WIDTH_HORIZONTAL,
  NODE_HEIGHT_HORIZONTAL,
  NODE_HEIGHT_VERTICAL,
  NODE_HORIZONTAL_GAP,
  NODE_VERTICAL_GAP,
  NODE_VERTICAL_GAP_VERTICAL,
  LEVEL_START_Y,
  CANVAS_PADDING,
} from "../constants";
import { buildHierarchyMap } from "./hierarchy-utils";

export function calculatePositions(
  flatNodes: FlatNode[],
  isHorizontal: boolean = false
): Map<string, { x: number; y: number }> {
  if (isHorizontal) {
    return calculatePositionsHorizontal(flatNodes);
  } else {
    return calculatePositionsVertical(flatNodes);
  }
}

function calculatePositionsVertical(
  flatNodes: FlatNode[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const hierarchy = buildHierarchyMap(flatNodes);
  const nodeMap = new Map(flatNodes.map((n) => [n.id, n]));

  // Find root nodes (nodes without parentId)
  const rootNodes = flatNodes.filter((n) => !n.parentId);
  if (rootNodes.length === 0) return positions;

  // Helper to recursively adjust all descendants
  const adjustSubtree = (nodeId: string, offset: number) => {
    const currentPos = positions.get(nodeId);
    if (currentPos) {
      positions.set(nodeId, { ...currentPos, x: currentPos.x + offset });
    }
    const children = hierarchy.get(nodeId) || [];
    children.forEach((child) => {
      adjustSubtree(child.id, offset);
    });
  };

  // Helper to get the actual bounds of a subtree (min and max X)
  const getSubtreeBounds = (nodeId: string): { minX: number; maxX: number } => {
    const pos = positions.get(nodeId);
    if (!pos) return { minX: 0, maxX: 0 };

    let minX = pos.x;
    let maxX = pos.x + NODE_WIDTH_VERTICAL;

    const children = hierarchy.get(nodeId) || [];
    children.forEach((child) => {
      const childBounds = getSubtreeBounds(child.id);
      minX = Math.min(minX, childBounds.minX);
      maxX = Math.max(maxX, childBounds.maxX);
    });

    return { minX, maxX };
  };

  // Recursive function to calculate positions
  const calculateNodePosition = (
    nodeId: string,
    level: number,
    startX: number
  ): { x: number; width: number } => {
    const node = nodeMap.get(nodeId);
    if (!node) return { x: startX, width: NODE_WIDTH_VERTICAL };

    const children = hierarchy.get(nodeId) || [];

    if (children.length === 0) {
      // Leaf node - position at startX
      const x = startX;
      const y =
        LEVEL_START_Y +
        level * (NODE_HEIGHT_VERTICAL + NODE_VERTICAL_GAP_VERTICAL);
      positions.set(nodeId, { x, y });
      return { x, width: NODE_WIDTH_VERTICAL };
    }

    // If there's only one child, center it directly below the parent
    if (children.length === 1) {
      // Position the parent at startX
      const parentX = startX;
      const parentY =
        LEVEL_START_Y +
        level * (NODE_HEIGHT_VERTICAL + NODE_VERTICAL_GAP_VERTICAL);
      positions.set(nodeId, { x: parentX, y: parentY });

      // Calculate child subtree width first (recursively, starting at 0)
      const childPos = calculateNodePosition(children[0].id, level + 1, 0);

      // Center the child directly below the parent
      const parentCenterX = parentX + NODE_WIDTH_VERTICAL / 2;
      const centeredChildX = parentCenterX - NODE_WIDTH_VERTICAL / 2;

      // Get the child's current position and adjust it
      const childCurrentPos = positions.get(children[0].id);
      if (childCurrentPos) {
        const offset = centeredChildX - childCurrentPos.x;
        // Adjust the child and all its descendants
        adjustSubtree(children[0].id, offset);
      }

      // COMPACTION: Always return NODE_WIDTH for single-child nodes
      return {
        x: parentX,
        width: NODE_WIDTH_VERTICAL,
      };
    }

    // Multiple children - calculate positions for all children
    let currentX = startX;
    let totalChildrenWidth = 0;
    const childPositions: Array<{ x: number; width: number; id: string }> = [];

    // First pass: position all children compactly
    children.forEach((child) => {
      const childPos = calculateNodePosition(child.id, level + 1, currentX);
      childPositions.push({ ...childPos, id: child.id });
      currentX += NODE_WIDTH_VERTICAL + NODE_HORIZONTAL_GAP;
      totalChildrenWidth += NODE_WIDTH_VERTICAL;
    });

    // Second pass: fix overlaps by checking actual bounds and adjusting
    for (let i = 1; i < childPositions.length; i++) {
      const prevChild = childPositions[i - 1];
      const currentChild = childPositions[i];

      const prevBounds = getSubtreeBounds(prevChild.id);
      const currentBounds = getSubtreeBounds(currentChild.id);

      // Check if there's overlap or insufficient gap
      const actualGap = currentBounds.minX - prevBounds.maxX;
      const requiredGap = NODE_HORIZONTAL_GAP;

      if (actualGap < requiredGap) {
        // Shift this child and all subsequent children
        const shiftAmount = requiredGap - actualGap;
        for (let j = i; j < childPositions.length; j++) {
          adjustSubtree(childPositions[j].id, shiftAmount);
          childPositions[j].x += shiftAmount;
        }
      }
    }

    // Position parent in the center of its children based on actual bounds
    const firstChildBounds = getSubtreeBounds(childPositions[0].id);
    const lastChildBounds = getSubtreeBounds(
      childPositions[childPositions.length - 1].id
    );

    const actualMinX = firstChildBounds.minX;
    const actualMaxX = lastChildBounds.maxX;
    const centerX = (actualMinX + actualMaxX) / 2;
    const x = centerX - NODE_WIDTH_VERTICAL / 2;

    const y =
      LEVEL_START_Y +
      level * (NODE_HEIGHT_VERTICAL + NODE_VERTICAL_GAP_VERTICAL);
    positions.set(nodeId, { x, y });

    // Return the actual width based on bounds
    const actualWidth = actualMaxX - actualMinX;
    return {
      x: actualMinX,
      width: Math.max(NODE_WIDTH_VERTICAL, actualWidth),
    };
  };

  // Calculate from all root nodes - start from 0
  let totalRootWidth = 0;
  rootNodes.forEach((rootNode) => {
    const rootPos = calculateNodePosition(rootNode.id, 0, totalRootWidth);
    totalRootWidth += rootPos.width + NODE_HORIZONTAL_GAP;
  });

  // Find the actual bounds of all nodes
  let minX = Infinity;
  let maxX = -Infinity;
  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + NODE_WIDTH_VERTICAL);
  });

  // Calculate offset to ensure all nodes are visible (pad left side)
  const leftPadding = CANVAS_PADDING;
  const offset = leftPadding - minX;

  // Apply offset to all positions
  positions.forEach((pos, nodeId) => {
    positions.set(nodeId, { ...pos, x: pos.x + offset });
  });

  return positions;
}

function calculatePositionsHorizontal(
  flatNodes: FlatNode[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const hierarchy = buildHierarchyMap(flatNodes);
  const nodeMap = new Map(flatNodes.map((n) => [n.id, n]));

  // Find root nodes (nodes without parentId)
  const rootNodes = flatNodes.filter((n) => !n.parentId);
  if (rootNodes.length === 0) return positions;

  // Helper to recursively adjust all descendants vertically
  const adjustSubtree = (nodeId: string, offset: number) => {
    const currentPos = positions.get(nodeId);
    if (currentPos) {
      positions.set(nodeId, { ...currentPos, y: currentPos.y + offset });
    }
    const children = hierarchy.get(nodeId) || [];
    children.forEach((child) => {
      adjustSubtree(child.id, offset);
    });
  };

  // Helper to get the actual bounds of a subtree (min and max Y)
  const getSubtreeBounds = (nodeId: string): { minY: number; maxY: number } => {
    const pos = positions.get(nodeId);
    if (!pos) return { minY: 0, maxY: 0 };

    let minY = pos.y;
    let maxY = pos.y + NODE_HEIGHT_HORIZONTAL;

    const children = hierarchy.get(nodeId) || [];
    children.forEach((child) => {
      const childBounds = getSubtreeBounds(child.id);
      minY = Math.min(minY, childBounds.minY);
      maxY = Math.max(maxY, childBounds.maxY);
    });

    return { minY, maxY };
  };

  // Recursive function to calculate positions (horizontal layout)
  const calculateNodePosition = (
    nodeId: string,
    level: number,
    startY: number
  ): { y: number; height: number } => {
    const node = nodeMap.get(nodeId);
    if (!node) return { y: startY, height: NODE_HEIGHT_HORIZONTAL };

    const children = hierarchy.get(nodeId) || [];

    if (children.length === 0) {
      // Leaf node - position at startY
      const y = startY;
      const x =
        LEVEL_START_Y + level * (NODE_WIDTH_HORIZONTAL + NODE_HORIZONTAL_GAP);
      positions.set(nodeId, { x, y });
      return { y, height: NODE_HEIGHT_HORIZONTAL };
    }

    // If there's only one child, center it directly to the right of the parent
    if (children.length === 1) {
      // Position the parent at startY
      const parentY = startY;
      const parentX =
        LEVEL_START_Y + level * (NODE_WIDTH_HORIZONTAL + NODE_HORIZONTAL_GAP);
      positions.set(nodeId, { x: parentX, y: parentY });

      // Calculate child subtree height first (recursively, starting at 0)
      const childPos = calculateNodePosition(children[0].id, level + 1, 0);

      // Center the child directly to the right of the parent
      const parentCenterY = parentY + NODE_HEIGHT_HORIZONTAL / 2;
      const centeredChildY = parentCenterY - NODE_HEIGHT_HORIZONTAL / 2;

      // Get the child's current position and adjust it
      const childCurrentPos = positions.get(children[0].id);
      if (childCurrentPos) {
        const offset = centeredChildY - childCurrentPos.y;
        // Adjust the child and all its descendants
        adjustSubtree(children[0].id, offset);
      }

      // COMPACTION: Always return NODE_HEIGHT for single-child nodes
      return {
        y: parentY,
        height: NODE_HEIGHT_HORIZONTAL,
      };
    }

    // Multiple children - calculate positions for all children
    let currentY = startY;
    let totalChildrenHeight = 0;
    const childPositions: Array<{ y: number; height: number; id: string }> = [];

    // First pass: position all children compactly
    children.forEach((child) => {
      const childPos = calculateNodePosition(child.id, level + 1, currentY);
      childPositions.push({ ...childPos, id: child.id });
      currentY += NODE_HEIGHT_HORIZONTAL + NODE_VERTICAL_GAP;
      totalChildrenHeight += NODE_HEIGHT_HORIZONTAL;
    });

    // Second pass: fix overlaps by checking actual bounds and adjusting
    for (let i = 1; i < childPositions.length; i++) {
      const prevChild = childPositions[i - 1];
      const currentChild = childPositions[i];

      const prevBounds = getSubtreeBounds(prevChild.id);
      const currentBounds = getSubtreeBounds(currentChild.id);

      // Check if there's overlap or insufficient gap
      const actualGap = currentBounds.minY - prevBounds.maxY;
      const requiredGap = NODE_VERTICAL_GAP;

      if (actualGap < requiredGap) {
        // Shift this child and all subsequent children
        const shiftAmount = requiredGap - actualGap;
        for (let j = i; j < childPositions.length; j++) {
          adjustSubtree(childPositions[j].id, shiftAmount);
          childPositions[j].y += shiftAmount;
        }
      }
    }

    // Position parent in the center of its children based on actual bounds
    const firstChildBounds = getSubtreeBounds(childPositions[0].id);
    const lastChildBounds = getSubtreeBounds(
      childPositions[childPositions.length - 1].id
    );

    const actualMinY = firstChildBounds.minY;
    const actualMaxY = lastChildBounds.maxY;
    const centerY = (actualMinY + actualMaxY) / 2;
    const y = centerY - NODE_HEIGHT_HORIZONTAL / 2;

    const x =
      LEVEL_START_Y + level * (NODE_WIDTH_HORIZONTAL + NODE_HORIZONTAL_GAP);
    positions.set(nodeId, { x, y });

    // Return the actual height based on bounds
    const actualHeight = actualMaxY - actualMinY;
    return {
      y: actualMinY,
      height: Math.max(NODE_HEIGHT_HORIZONTAL, actualHeight),
    };
  };

  // Calculate from all root nodes - start from 0
  let totalRootHeight = 0;
  rootNodes.forEach((rootNode) => {
    const rootPos = calculateNodePosition(rootNode.id, 0, totalRootHeight);
    totalRootHeight += rootPos.height + NODE_VERTICAL_GAP;
  });

  // Find the actual bounds of all nodes
  let minY = Infinity;
  let maxY = -Infinity;
  positions.forEach((pos) => {
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + NODE_HEIGHT_HORIZONTAL);
  });

  // Calculate offset to ensure all nodes are visible (pad top side)
  const topPadding = CANVAS_PADDING;
  const offset = topPadding - minY;

  // Apply offset to all positions
  positions.forEach((pos, nodeId) => {
    positions.set(nodeId, { ...pos, y: pos.y + offset });
  });

  return positions;
}

export function buildConnections(
  flatNodes: FlatNode[],
  positions: Map<string, { x: number; y: number }>
): Connection[] {
  const connections: Connection[] = [];
  flatNodes.forEach((node) => {
    if (node.parentId) {
      const fromPos = positions.get(node.parentId);
      const toPos = positions.get(node.id);
      if (fromPos && toPos) {
        connections.push({
          id: `${node.parentId}-${node.id}`,
          from: node.parentId,
          to: node.id,
        });
      }
    }
  });
  return connections;
}

export function calculateCanvasDimensions(
  positions: Map<string, { x: number; y: number }>,
  isHorizontal: boolean = false
): { canvasWidth: number; canvasHeight: number } {
  const nodeHeight = isHorizontal
    ? NODE_HEIGHT_HORIZONTAL
    : NODE_HEIGHT_VERTICAL;
  const nodeWidth = isHorizontal ? NODE_WIDTH_HORIZONTAL : NODE_WIDTH_VERTICAL;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  positions.forEach((pos) => {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + nodeWidth);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + nodeHeight);
  });
  // Ensure minimum dimensions and add padding on both sides
  const width = Math.max(maxX - minX + CANVAS_PADDING * 2, 2000);
  const height = Math.max(maxY - minY + CANVAS_PADDING * 2, 1000);
  return {
    canvasWidth: width,
    canvasHeight: height,
  };
}
