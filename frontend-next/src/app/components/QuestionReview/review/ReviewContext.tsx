"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ReviewAnnotation,
  ReviewTarget,
} from "./review-types";

type ReviewContextValue = {
  annotations: ReviewAnnotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<ReviewAnnotation[]>>;
  drawerOpen: boolean;
  activeTarget: ReviewTarget | null;
  openDrawer: (target: ReviewTarget) => void;
  closeDrawer: () => void;
  countForTarget: (targetKey: string) => number;
  annotationsForTarget: (targetKey: string) => ReviewAnnotation[];
  annotationsForBlock: (targetKey: string) => ReviewAnnotation[];
};

const ReviewContext = createContext<ReviewContextValue | null>(null);

export function ReviewProvider({
  annotations,
  setAnnotations,
  children,
}: {
  annotations: ReviewAnnotation[];
  setAnnotations: React.Dispatch<React.SetStateAction<ReviewAnnotation[]>>;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<ReviewTarget | null>(null);

  const openDrawer = useCallback((target: ReviewTarget) => {
    setActiveTarget(target);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveTarget(null);
  }, []);

  const countForTarget = useCallback(
    (targetKey: string) =>
      annotations.filter(
        (a) =>
          a.targetKey === targetKey || a.targetKey.startsWith(`${targetKey}:`)
      ).length,
    [annotations]
  );

  const annotationsForTarget = useCallback(
    (targetKey: string) =>
      annotations.filter((a) => a.targetKey === targetKey),
    [annotations]
  );

  const annotationsForBlock = useCallback(
    (targetKey: string) =>
      annotations.filter(
        (a) =>
          a.targetKey === targetKey ||
          a.targetKey.startsWith(`${targetKey}:`)
      ),
    [annotations]
  );

  const value = useMemo(
    () => ({
      annotations,
      setAnnotations,
      drawerOpen,
      activeTarget,
      openDrawer,
      closeDrawer,
      countForTarget,
      annotationsForTarget,
      annotationsForBlock,
    }),
    [
      annotations,
      setAnnotations,
      drawerOpen,
      activeTarget,
      openDrawer,
      closeDrawer,
      countForTarget,
      annotationsForTarget,
      annotationsForBlock,
    ]
  );

  return (
    <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
  );
}

export function useReviewContext() {
  const ctx = useContext(ReviewContext);
  if (!ctx) {
    throw new Error("useReviewContext must be used within ReviewProvider");
  }
  return ctx;
}
