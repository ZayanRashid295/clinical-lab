import { createContext, useContext } from "react";

export type HeaderLeadingContent =
  | React.ReactNode
  | (() => React.ReactNode);

export type LayoutHeaderLeadingContextValue = {
  setLeadingContent: (node: HeaderLeadingContent | null) => void;
};

export const LayoutHeaderLeadingContext =
  createContext<LayoutHeaderLeadingContextValue | null>(null);

export function useLayoutHeaderLeading() {
  return useContext(LayoutHeaderLeadingContext);
}
