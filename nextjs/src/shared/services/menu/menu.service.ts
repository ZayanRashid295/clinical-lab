import { useState, useCallback, useMemo } from "react";
import { MenuItem, MenuState, User } from "../../types/menu";

// Default menu items with translation keys
const defaultMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "menu.dashboard",
    icon: "🏠",
    path: "/dashboard",
    roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
    order: 1,
  },
  {
    id: "fleet",
    label: "menu.fleet",
    icon: "🚛",
    path: "/fleet",
    roles: ["ADMIN", "FLEET_MANAGER"],
    order: 2,
    submenu: [
      {
        id: "vehicles",
        label: "menu.vehicles",
        icon: "🚗",
        path: "/fleet/vehicles",
        roles: ["ADMIN", "FLEET_MANAGER"],
        order: 1,
      },
      {
        id: "drivers",
        label: "menu.drivers",
        icon: "👨‍💼",
        path: "/fleet/drivers",
        roles: ["ADMIN", "FLEET_MANAGER"],
        order: 2,
      },
      {
        id: "maintenance",
        label: "menu.maintenance",
        icon: "🔧",
        path: "/fleet/maintenance",
        roles: ["ADMIN", "FLEET_MANAGER"],
        order: 3,
      },
    ],
  },
  {
    id: "analytics",
    label: "menu.analytics",
    icon: "📊",
    path: "/analytics",
    roles: ["ADMIN", "FLEET_MANAGER"],
    order: 3,
    submenu: [
      {
        id: "revenue",
        label: "menu.revenue",
        icon: "💰",
        path: "/analytics/revenue",
        roles: ["ADMIN", "FLEET_MANAGER"],
        order: 1,
      },
      {
        id: "performance",
        label: "menu.performance",
        icon: "📊",
        path: "/analytics/performance",
        roles: ["ADMIN", "FLEET_MANAGER"],
        order: 2,
      },
      {
        id: "reports",
        label: "menu.reports",
        icon: "📝",
        path: "/analytics/reports",
        roles: ["ADMIN", "FLEET_MANAGER"],
        order: 3,
      },
    ],
  },
  {
    id: "payments",
    label: "menu.payments",
    icon: "💳",
    path: "/payments",
    roles: ["ADMIN", "DRIVER", "PASSENGER"],
    order: 4,
    submenu: [
      {
        id: "transactions",
        label: "menu.transactions",
        icon: "🧾",
        path: "/payments/transactions",
        roles: ["ADMIN", "DRIVER", "PASSENGER"],
        order: 1,
      },
      {
        id: "payouts",
        label: "menu.payouts",
        icon: "💰",
        path: "/payments/payouts",
        roles: ["ADMIN", "DRIVER"],
        order: 2,
      },
      {
        id: "billing",
        label: "menu.billing",
        icon: "🧾",
        path: "/payments/billing",
        roles: ["ADMIN", "PASSENGER"],
        order: 3,
      },
    ],
  },
  {
    id: "study",
    label: "menu.study",
    icon: "📚",
    path: "/study",
    roles: ["ADMIN", "STUDENT", "FACULTY"],
    order: 5,
    submenu: [
      {
        id: "question-bank",
        label: "menu.questionBank",
        icon: "🗂️",
        path: "/study/question-bank",
        roles: ["ADMIN", "STUDENT", "FACULTY"],
        order: 1,
      },
      {
        id: "study-materials",
        label: "menu.studyMaterials",
        icon: "📄",
        path: "/study/materials",
        roles: ["ADMIN", "STUDENT", "FACULTY"],
        order: 2,
      },
      {
        id: "flashcards",
        label: "menu.flashcards",
        icon: "🃏",
        path: "/study/flashcards",
        roles: ["ADMIN", "STUDENT", "FACULTY"],
        order: 3,
      },
      {
        id: "notes",
        label: "menu.notes",
        icon: "📝",
        path: "/study/notes",
        roles: ["ADMIN", "STUDENT", "FACULTY"],
        order: 4,
      },
    ],
  },
  {
    id: "test-creation",
    label: "menu.testCreation",
    icon: "✏️",
    path: "/test-creation",
    roles: ["ADMIN", "FACULTY"],
    order: 6,
    submenu: [
      {
        id: "create-new-test",
        label: "menu.createNewTest",
        icon: "➕",
        path: "/test-creation/new",
        roles: ["ADMIN", "FACULTY"],
        order: 1,
      },
      {
        id: "test-templates",
        label: "menu.testTemplates",
        icon: "📋",
        path: "/test-creation/templates",
        roles: ["ADMIN", "FACULTY"],
        order: 2,
      },
      {
        id: "question-builder",
        label: "menu.questionBuilder",
        icon: "🔨",
        path: "/test-creation/builder",
        roles: ["ADMIN", "FACULTY"],
        order: 3,
      },
      {
        id: "test-settings",
        label: "menu.testSettings",
        icon: "⚙️",
        path: "/test-creation/settings",
        roles: ["ADMIN", "FACULTY"],
        order: 4,
      },
    ],
  },
  {
    id: "test-session",
    label: "menu.testSession",
    icon: "🎯",
    path: "/test-session",
    roles: ["ADMIN", "STUDENT", "FACULTY"],
    order: 7,
    submenu: [
      {
        id: "active-tests",
        label: "menu.activeTests",
        icon: "⏱️",
        path: "/test-session/active",
        roles: ["ADMIN", "STUDENT", "FACULTY"],
        order: 1,
      },
      {
        id: "test-history",
        label: "menu.testHistory",
        icon: "📊",
        path: "/test-session/history",
        roles: ["ADMIN", "STUDENT", "FACULTY"],
        order: 2,
      },
      {
        id: "practice-mode",
        label: "menu.practiceMode",
        icon: "🏃",
        path: "/test-session/practice",
        roles: ["ADMIN", "STUDENT", "FACULTY"],
        order: 3,
      },
      {
        id: "timed-tests",
        label: "menu.timedTests",
        icon: "⏰",
        path: "/test-session/timed",
        roles: ["ADMIN", "STUDENT", "FACULTY"],
        order: 4,
      },
    ],
  },
  {
    id: "med-app",
    label: "menu.medApp",
    icon: "🏥",
    path: "/med-app",
    roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
    order: 8,
  },
  {
    id: "zoom-simulation",
    label: "menu.zoomSimulation",
    icon: "📹",
    path: "/zoom",
    roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
    order: 9,
  },
  {
    id: "shadow-mode",
    label: "menu.shadowMode",
    icon: "👁️",
    path: "/shadow-mode",
    roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
    order: 10,
  },
  {
    id: "shadow-mode-legacy",
    label: "menu.shadowModeLegacy",
    icon: "👁️",
    path: "/shadow-mode-legacy",
    roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
    order: 11,
  },
  {
    id: "admin",
    label: "menu.admin",
    icon: "⚙️",
    path: "/admin",
    roles: ["ADMIN"],
    order: 12,
    submenu: [
      {
        id: "users",
        label: "menu.users",
        icon: "👥",
        path: "/admin/users",
        roles: ["ADMIN"],
        order: 1,
      },
      {
        id: "roles",
        label: "menu.roles",
        icon: "🔐",
        path: "/admin/roles",
        roles: ["ADMIN"],
        order: 2,
      },
      {
        id: "settings",
        label: "menu.settings",
        icon: "⚙️",
        path: "/admin/settings",
        roles: ["ADMIN"],
        order: 3,
      },
    ],
  },
];

export const useMenuService = () => {
  const [menuState, setMenuState] = useState<MenuState>({
    activeMenu: "",
    expandedMenus: [],
    isCollapsed: false,
    menuItems: [],
  });

  // Filter menu items based on user roles
  const filterMenuItemsByRoles = useCallback(
    (items: MenuItem[], roles: string[]): MenuItem[] => {
      return items
        .filter((item) => {
          // Check if user has any of the required roles for this menu item
          const hasAccess = item.roles.some((role) => roles.includes(role));
          if (!hasAccess) return false;

          // If item has submenu, filter submenu items as well
          if (item.submenu && item.submenu.length > 0) {
            const filteredSubmenu = filterMenuItemsByRoles(item.submenu, roles);
            return filteredSubmenu.length > 0;
          }

          return true;
        })
        .map((item) => ({
          ...item,
          submenu: item.submenu
            ? filterMenuItemsByRoles(item.submenu, roles)
            : null,
        }))
        .sort((a, b) => a.order - b.order);
    },
    []
  );

  // Initialize menu with user roles
  const initializeMenu = useCallback(
    (roles: string[]) => {
      const filteredItems = filterMenuItemsByRoles(defaultMenuItems, roles);
      setMenuState((prev) => ({
        ...prev,
        menuItems: filteredItems,
      }));
    },
    [filterMenuItemsByRoles]
  );

  // Set active menu
  const setActiveMenu = useCallback((menuId: string) => {
    setMenuState((prev) => ({
      ...prev,
      activeMenu: menuId,
    }));
  }, []);

  // Toggle menu expansion
  const toggleMenuExpansion = useCallback((menuId: string) => {
    setMenuState((prev) => ({
      ...prev,
      expandedMenus: prev.expandedMenus.includes(menuId)
        ? prev.expandedMenus.filter((id) => id !== menuId)
        : [...prev.expandedMenus, menuId],
    }));
  }, []);

  // Toggle sidebar collapse
  const toggleSidebarCollapse = useCallback(() => {
    setMenuState((prev) => ({
      ...prev,
      isCollapsed: !prev.isCollapsed,
    }));
  }, []);

  // Sync menu state from current path
  const syncMenuStateFromPath = useCallback(
    (path: string) => {
      const findMenuItemByPath = (
        items: MenuItem[],
        targetPath: string
      ): MenuItem | null => {
        for (const item of items) {
          if (item.path === targetPath) {
            return item;
          }
          if (item.submenu) {
            const found = findMenuItemByPath(item.submenu, targetPath);
            if (found) return found;
          }
        }
        return null;
      };

      const foundItem = findMenuItemByPath(menuState.menuItems, path);
      if (foundItem) {
        setActiveMenu(foundItem.id);

        // If it's a submenu item, expand the parent
        const parentItem = menuState.menuItems.find((item) =>
          item.submenu?.some((subItem) => subItem.id === foundItem.id)
        );
        if (parentItem && !menuState.expandedMenus.includes(parentItem.id)) {
          setMenuState((prev) => ({
            ...prev,
            expandedMenus: [...prev.expandedMenus, parentItem.id],
          }));
        }
      }
    },
    [menuState.menuItems, menuState.expandedMenus, setActiveMenu]
  );

  // Reset menu state
  const resetMenuState = useCallback(() => {
    setMenuState({
      activeMenu: "",
      expandedMenus: [],
      isCollapsed: false,
      menuItems: [],
    });
  }, []);

  // Get icon class for menu item
  const getIconClass = useCallback((icon: string): string => {
    if (
      icon.startsWith("fas") ||
      icon.startsWith("far") ||
      icon.startsWith("fab")
    ) {
      return icon;
    }
    // For emoji icons, return as is
    return icon;
  }, []);

  // Check if menu item has submenu
  const hasSubmenu = useCallback((item: MenuItem): boolean => {
    return !!(item.submenu && item.submenu.length > 0);
  }, []);

  // Check if submenu is active
  const isSubmenuActive = useCallback(
    (menuId: string): boolean => {
      return menuState.expandedMenus.includes(menuId);
    },
    [menuState.expandedMenus]
  );

  return {
    // State
    menuItems: menuState.menuItems,
    activeMenu: menuState.activeMenu,
    expandedMenus: menuState.expandedMenus,
    isCollapsed: menuState.isCollapsed,

    // Actions
    initializeMenu,
    setActiveMenu,
    toggleMenuExpansion,
    toggleSidebarCollapse,
    syncMenuStateFromPath,
    resetMenuState,

    // Utilities
    getIconClass,
    hasSubmenu,
    isSubmenuActive,
  };
};
