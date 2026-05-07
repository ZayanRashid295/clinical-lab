/**
 * Sidebar section grouping: maps each section to top-level menu item ids from MENU_CONFIG.
 * Order here defines display order in the navigation panel.
 */
export type NavSidebarSectionId =
  | "overview"
  | "content"
  | "learning"
  | "tools"
  | "platform";

export interface NavSidebarSectionDef {
  id: NavSidebarSectionId;
  /** i18n key, e.g. nav.section.overview */
  labelKey: string;
  /** Top-level `MenuItem.id` values belonging to this section */
  menuItemIds: readonly string[];
}

export const NAV_SIDEBAR_SECTIONS: readonly NavSidebarSectionDef[] = [
  {
    id: "overview",
    labelKey: "nav.section.overview",
    /** Dashboard + student entry points; keep students from an empty Overview section */
    menuItemIds: ["dashboard", "my-subscription"],
  },
  {
    id: "content",
    labelKey: "nav.section.content",
    menuItemIds: ["content", "subscriptions"],
  },
  {
    id: "learning",
    labelKey: "nav.section.learning",
    menuItemIds: [
      "study",
      "test-creation",
      "ai-tutor",
      "medprep-ai",
      "community",
      "assessments",
    ],
  },
  {
    id: "tools",
    labelKey: "nav.section.tools",
    menuItemIds: ["question-generator", "admin", "support"],
  },
  {
    id: "platform",
    labelKey: "nav.section.platform",
    menuItemIds: ["chat", "payments", "development"],
  },
] as const;
