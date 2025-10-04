"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/shared/contexts/auth-context";
import { useTheme } from "@/shared/contexts/theme-context";
import { useMenuService } from "@/shared/services/menu/menu.service";
import { colorSchemesService } from "@/shared/services/theme/color-schemes/color-schemes.service";
import { MenuItem } from "@/shared/types/menu";
import AdaptiveLayout from "@/shared/components/layout/adaptive-layout";
import SettingsModal from "@/shared/components/settings/settings-modal";
import ContentSwitcher from "@/shared/components/menu-system/content-switcher";

interface DashboardLayoutProps {
  children?: React.ReactNode;
  activeMenuId?: string;
}

export default function DashboardLayout({
  children,
  activeMenuId,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { config } = useTheme();

  const {
    menuItems,
    activeMenu,
    expandedMenus,
    isCollapsed,
    initializeMenu,
    setActiveMenu,
    toggleMenuExpansion,
    toggleSidebarCollapse,
    syncMenuStateFromPath,
    resetMenuState,
  } = useMenuService();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize menu when user changes
  useEffect(() => {
    if (user) {
      initializeMenu(user.roles || []);
    } else {
      // Provide default menu items for demo/testing
      initializeMenu(["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"]);
    }
    setIsInitialized(true);
  }, [user, initializeMenu]);

  // Set active menu based on pathname or prop (only for initial load)
  useEffect(() => {
    if (activeMenuId && !activeMenu) {
      // Only set from activeMenuId if no activeMenu is set yet (initial load)
      setActiveMenu(activeMenuId);
    } else if (menuItems.length > 0 && !activeMenu) {
      // Only sync from pathname if no activeMenu is set yet (initial load)
      syncMenuStateFromPath(pathname);
    }
  }, [
    activeMenuId,
    pathname,
    menuItems,
    setActiveMenu,
    syncMenuStateFromPath,
    activeMenu,
  ]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (menuItems.length > 0) {
        syncMenuStateFromPath(window.location.pathname);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [menuItems, syncMenuStateFromPath]);

  // Debug: Track activeMenu state changes
  useEffect(() => {
    console.log("activeMenu state changed to:", activeMenu);
  }, [activeMenu]);

  // Show loading state in content area while initializing
  const renderContent = () => {
    if (!isInitialized || menuItems.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    // Prioritize activeMenu state over activeMenuId prop for navigation
    // activeMenuId is only used for initial page load, not for menu navigation
    const currentActiveMenu = activeMenu;
    console.log("RenderContent:", {
      activeMenuId,
      activeMenu,
      currentActiveMenu,
    });
    return <ContentSwitcher activeMenu={currentActiveMenu} />;
  };

  // Handle menu click - Switch content and update URL
  const handleMenuClick = (menuId: string) => {
    console.log("=== MENU CLICK HANDLER CALLED ===");
    console.log("Menu clicked:", menuId, "Current activeMenu:", activeMenu);

    // Force immediate state update
    setActiveMenu(menuId);

    // Also update URL immediately
    const findMenuItemById = (
      items: MenuItem[],
      id: string
    ): MenuItem | null => {
      for (const item of items) {
        if (item.id === id) {
          return item;
        }
        if (item.submenu) {
          const found = findMenuItemById(item.submenu, id);
          if (found) return found;
        }
      }
      return null;
    };

    const menuItem = findMenuItemById(menuItems, menuId);
    if (menuItem && menuItem.path) {
      // Update URL without causing page reload
      if (pathname !== menuItem.path) {
        window.history.pushState(null, "", menuItem.path);
      }
    }

    console.log("After setActiveMenu, new activeMenu should be:", menuId);
  };

  // Handle menu toggle (for submenus)
  const handleMenuToggle = (menuId: string) => {
    toggleMenuExpansion(menuId);
  };

  // Handle collapse toggle
  const handleCollapseToggle = () => {
    toggleSidebarCollapse();
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    resetMenuState();
    router.push("/landing-page");
  };

  // Handle settings
  const handleSettingsOpen = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  // Handle search
  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log("Search query:", query);
  };

  // Get current color scheme
  const currentColorScheme = colorSchemesService.getColorScheme(
    config.colorScheme
  );
  const primaryColor = currentColorScheme.primary[500];
  const primaryHoverColor = currentColorScheme.primary[700];

  return (
    <>
      {/* Adaptive Layout */}
      <AdaptiveLayout
        menuItems={menuItems}
        activeMenu={activeMenu}
        expandedMenus={expandedMenus}
        user={user}
        applicationTitle="Clinical Lab App"
        isSidebarCollapsed={isCollapsed}
        enableSearch={true}
        searchPlaceholder="Search..."
        onLogout={handleLogout}
        onMenuChange={handleMenuClick}
        onMenuToggle={handleMenuToggle}
        onCollapseToggle={handleCollapseToggle}
        onSearch={handleSearch}
      >
        {renderContent()}
      </AdaptiveLayout>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={handleSettingsClose} />

      {/* Settings Floating Button */}
      <button
        onClick={handleSettingsOpen}
        className="fixed bottom-6 right-6 p-4 text-white rounded-full shadow-lg transition-colors duration-200 z-40"
        style={{
          backgroundColor: primaryColor,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = primaryHoverColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = primaryColor;
        }}
        title="Settings"
      >
        <i className="fas fa-cog text-lg" />
      </button>
    </>
  );
}
