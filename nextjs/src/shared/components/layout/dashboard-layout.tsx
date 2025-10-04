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

  // Initialize menu when user changes
  useEffect(() => {
    if (user) {
      initializeMenu(user.roles || []);
    } else {
      // Provide default menu items for demo/testing
      initializeMenu(["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"]);
    }
  }, [user, initializeMenu]);

  // Set active menu based on pathname or prop
  useEffect(() => {
    if (activeMenuId) {
      setActiveMenu(activeMenuId);
    } else if (menuItems.length > 0) {
      syncMenuStateFromPath(pathname);
    }
  }, [activeMenuId, pathname, menuItems, setActiveMenu, syncMenuStateFromPath]);

  // Handle menu click - Navigate to proper routes
  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId);

    // Find the menu item and navigate to its path
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
      router.push(menuItem.path);
    }
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
        {children || <ContentSwitcher activeMenu={activeMenu} />}
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
