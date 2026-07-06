// Main MenuSystem component
export { default as MenuSystem } from "./MenuSystem";

// Layout components
export { default as Header } from "./Layout/Header";

// Navigation components
export { default as Sidebar } from "./Navigation/Sidebar";

// Modal components
export * from "./Modal";

// Form components
export * from "./Form";

// Common utilities
export { iconMap } from "./Common/IconMap";

// Placeholder components
export { default as UnderConstruction } from "./placeholders/under-construction";

export {
  SubscriptionUpgradeModal,
  type SubscriptionUpgradeModalProps,
} from "./SubscriptionUpgradeModal";

export {
  useSubscriptionUpgradeModal,
  useStudyFeatureGate,
  STUDY_FEATURE_KEYS,
} from "@/hooks/useSubscriptionUpgradeModal";

// Default export
export { default } from "./MenuSystem";
