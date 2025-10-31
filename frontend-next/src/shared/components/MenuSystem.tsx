import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { authService } from "../services/auth.service";
import { getMenuItemsForRole, MenuItem } from "../../app/types/menu";
import { MenuSystemProps } from "../../app/types/ui";
import { User } from "../../app/types/core";
import AdaptiveLayout from "./Layout/AdaptiveLayout";
import MenuLayoutSettings from "./Settings/MenuLayoutSettings";
import { SettingsButton } from "./Settings/SettingsButton";
import {
  UIConfigProvider,
  useUIConfigContext,
} from "../contexts/UIConfigContext";
import { typography, spacing } from "../utils/responsive";
import ContentRenderer from "./Content/ContentRenderer";
// import { createContentRegistry } from "../../app/config/content.registry";
import { COLOR_SCHEMES } from "../../app/config/theme.service";
// import { ContentRegistry } from "../../app/types/dashboard";

const MenuSystem: React.FC<MenuSystemProps> = ({
  children,
  customDashboard,
  customMenuItems,
  onMenuChange,
  applicationTitle = "Application Portal",
  enableSearch = true,
  searchPlaceholder,
  customContent = {},
  contentRegistry,
}) => {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const filteredMenuItems =
        customMenuItems || getMenuItemsForRole(currentUser.roles || []);
      setMenuItems(filteredMenuItems);
    }
  }, [customMenuItems]);

  // Sync activeMenu with current route
  useEffect(() => {
    // Only run if we have menu items
    if (menuItems.length === 0) return;

    const findMenuIdByPath = (
      items: MenuItem[],
      path: string
    ): string | null => {
      for (const item of items) {
        if (item.path === path) {
          return item.id;
        }
        if (item.submenu) {
          const subId = findMenuIdByPath(item.submenu, path);
          if (subId) return subId;
        }
      }
      return null;
    };

    const syncMenuWithPath = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const menuId = findMenuIdByPath(menuItems, path);

      if (menuId && menuId !== activeMenu) {
        setActiveMenu(menuId);

        // Auto-expand parent menu if it's a submenu item
        const parentItem = menuItems.find((item) =>
          item.submenu?.some((sub) => sub.id === menuId)
        );
        if (parentItem && !expandedMenus.includes(parentItem.id)) {
          setExpandedMenus((prev) => [...prev, parentItem.id]);
        }
      } else if (!menuId && path === "/") {
        // Default to dashboard for root path
        setActiveMenu("dashboard");
      }
    };

    // Initial sync
    syncMenuWithPath();

    // Listen for browser back/forward navigation
    const handlePopState = () => {
      syncMenuWithPath();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [menuItems, activeMenu, expandedMenus]);

  const handleMenuChange = (menuId: string) => {
    // Close mobile menu when item selected
    setIsMobileMenuOpen(false);

    // Find the menu item and its path
    const findMenuPath = (items: MenuItem[], id: string): string | null => {
      for (const item of items) {
        if (item.id === id) {
          return item.path;
        }
        if (item.submenu) {
          const subPath = findMenuPath(item.submenu, id);
          if (subPath) return subPath;
        }
      }
      return null;
    };

    const menuPath = findMenuPath(menuItems, menuId);
    if (menuPath) {
      // Update the active menu immediately
      setActiveMenu(menuId);
      setCurrentPath(menuPath);

      // Update the URL without triggering navigation
      window.history.pushState(null, "", menuPath);

      // Trigger a custom event for any components that need to know about route changes
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      // Only set activeMenu directly if no path found (shouldn't happen normally)
      setActiveMenu(menuId);
    }

    if (onMenuChange) {
      onMenuChange(menuId);
    }
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      console.log("Logout successful, redirecting to landing page");
      router.replace("/landing-page");
    } catch (error) {
      console.error("Logout failed:", error);
      router.replace("/landing-page");
    }
  };

  // Get the content registry to use
  const registry = useMemo(() => {
    return contentRegistry;
  }, [contentRegistry]);

  // Function to get the appropriate page content based on current path
  const getPageContent = useCallback(() => {
    // Handle dashboard routes specially
    if (currentPath === "/" || currentPath === "/dashboard") {
      if (customDashboard) {
        const CustomDashboard = customDashboard;
        return <CustomDashboard />;
      }
      // Check if there's a dashboard configuration for this route
      if (registry?.dashboards?.[currentPath]) {
        return (
          <ContentRenderer
            path={currentPath}
            contentConfig={registry.content}
            dashboards={registry.dashboards}
            customContent={customContent}
            defaultContent={registry.defaultContent}
          >
            {children}
          </ContentRenderer>
        );
      }
      return (
        <div
          className={`bg-white rounded-lg shadow border ${spacing.component.md}`}
        >
          <h2 className={`${typography.heading[1]} text-gray-900 mb-4`}>
            Dashboard
          </h2>
          <p className={typography.body.regular}>
            Please provide a customDashboard component for your
            application-specific dashboard content.
          </p>
        </div>
      );
    }

    // Check if there's custom content for the current active menu ID first
    if (customContent[activeMenu]) {
      const CustomComponent = customContent[activeMenu];
      return <CustomComponent />;
    }

    // Use the ContentRenderer for all other paths
    return (
      <ContentRenderer
        path={currentPath}
        contentConfig={registry?.content || {}}
        dashboards={registry?.dashboards || {}}
        customContent={customContent}
        defaultContent={registry?.defaultContent}
      >
        {children}
      </ContentRenderer>
    );
  }, [
    currentPath,
    customDashboard,
    customContent,
    registry,
    children,
    activeMenu,
  ]);

  const renderContent = useCallback(() => {
    return getPageContent();
  }, [getPageContent]);

  return (
    <UIConfigProvider>
      <AdaptiveLayout
        menuItems={menuItems}
        activeMenu={activeMenu}
        expandedMenus={expandedMenus}
        user={user}
        applicationTitle={applicationTitle}
        onMenuChange={handleMenuChange}
        onToggleMenu={toggleMenu}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        enableSearch={enableSearch}
        searchPlaceholder={searchPlaceholder}
        onSearch={(query) => {
          // Handle search functionality
          console.log("Search query:", query);
        }}
        onLogout={handleLogout}
      >
        <div key={activeMenu}>
          {renderContent()}
        </div>
      </AdaptiveLayout>

      {/* Settings Panel */}
      <MenuLayoutSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Settings Toggle Button */}
      <SettingsButton onClick={() => setIsSettingsOpen(true)} />
    </UIConfigProvider>
  );
};

export default MenuSystem;
