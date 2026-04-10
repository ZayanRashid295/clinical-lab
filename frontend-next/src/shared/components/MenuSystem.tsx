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
  // Initialize currentPath from router or window location
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== "undefined" ? window.location.pathname : ""
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      
      // Extract roles - handle both string array and object array formats
      let userRoles: string[] = [];
      if (currentUser.roles) {
        if (Array.isArray(currentUser.roles)) {
          userRoles = currentUser.roles.map((role: any) => 
            typeof role === 'string' ? role : role.role?.name || role.name || role
          ).filter(Boolean);
        }
      }
      
      const filteredMenuItems =
        customMenuItems || getMenuItemsForRole(userRoles);
      
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

    const syncMenuWithPath = (path?: string) => {
      const currentPathValue = path || window.location.pathname;
      setCurrentPath(currentPathValue);
      const menuId = findMenuIdByPath(menuItems, currentPathValue);

      if (menuId && menuId !== activeMenu) {
        setActiveMenu(menuId);

        // Auto-expand parent menu if it's a submenu item
        const parentItem = menuItems.find((item) =>
          item.submenu?.some((sub) => sub.id === menuId)
        );
        if (parentItem && !expandedMenus.includes(parentItem.id)) {
          setExpandedMenus((prev) => [...prev, parentItem.id]);
        }
      } else if (!menuId && currentPathValue === "/") {
        // Default to dashboard for root path
        setActiveMenu("dashboard");
      }
    };

    // Initial sync
    syncMenuWithPath();

    // Listen for Next.js router route changes
    const handleRouteChange = (url: string) => {
      syncMenuWithPath(url);
    };

    // Listen for browser back/forward navigation
    const handlePopState = () => {
      syncMenuWithPath();
    };

    // Subscribe to Next.js router events
    router.events.on("routeChangeComplete", handleRouteChange);
    window.addEventListener("popstate", handlePopState);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [menuItems, activeMenu, expandedMenus, router]);

  const handleMenuChange = (menuId: string) => {
    // Close mobile menu when item selected
    setIsMobileMenuOpen(false);

    // Find the menu item and its path/action
    const findMenuItem = (items: MenuItem[], id: string): MenuItem | null => {
      for (const item of items) {
        if (item.id === id) {
          return item;
        }
        if (item.submenu) {
          const subItem = findMenuItem(item.submenu, id);
          if (subItem) return subItem;
        }
      }
      return null;
    };

    const menuItem = findMenuItem(menuItems, menuId);
    
    // Handle custom actions
    if (menuItem?.action === "open-subscription-modal") {
      // Dispatch custom event to open subscription modal
      const event = new CustomEvent("open-subscription-modal", { bubbles: true });
      window.dispatchEvent(event);
      if (onMenuChange) {
        onMenuChange(menuId);
      }
      return;
    }

    const menuPath = menuItem?.path;
    if (menuPath && menuPath !== "#") {
      // Update the active menu immediately
      setActiveMenu(menuId);
      setCurrentPath(menuPath);

      // Use Next.js router for navigation to ensure proper route handling
      router.push(menuPath, undefined, { shallow: false });
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
    // Determine the effective path (use router pathname as fallback)
    const effectivePath = currentPath || (typeof window !== "undefined" ? window.location.pathname : "/");
    
    // Handle dashboard routes specially
    if (effectivePath === "/" || effectivePath === "/dashboard") {
      if (customDashboard) {
        const CustomDashboard = customDashboard;
        return <CustomDashboard />;
      }
      
      // Use ContentRenderer which handles both content and dashboards properly
      // It checks content first, then dashboards, then defaultContent
      return (
        <ContentRenderer
          path={effectivePath === "/dashboard" ? "/" : effectivePath}
          contentConfig={registry?.content || {}}
          dashboards={registry?.dashboards || {}}
          customContent={customContent}
          defaultContent={registry?.defaultContent}
        >
          {children}
        </ContentRenderer>
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
        onLogout={handleLogout}
      >
        <div key={activeMenu} className="h-full min-h-0 flex flex-col">
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
