"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/auth-context";
import { useTheme } from "../../contexts/theme-context";
import { useMenuService } from "../../services/menu/menu.service";
import { colorSchemesService } from "../../services/theme/color-schemes/color-schemes.service";
import { MenuItem, User, MenuSystemProps } from "../../types/menu";
import AdaptiveLayout from "../layout/adaptive-layout";
import SettingsModal from "../settings/settings-modal";

const MenuSystem: React.FC<MenuSystemProps> = ({
  customDashboard,
  customMenuItems,
  onMenuChange,
  applicationTitle = "Ride Sharing App",
  enableSearch = true,
  searchPlaceholder = "Search...",
  customContent,
  children,
}) => {
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

  // Sync menu state with current path
  useEffect(() => {
    if (menuItems.length > 0) {
      syncMenuStateFromPath(pathname);
    }
  }, [pathname, menuItems, syncMenuStateFromPath]);

  // Handle menu click
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

    // Call custom onMenuChange if provided
    if (onMenuChange) {
      onMenuChange(menuId);
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
    router.push("/login");
  };

  // Handle search
  const handleSearch = (query: string) => {
    // Implement search functionality here
  };

  // Handle settings open
  const handleSettingsOpen = () => {
    setIsSettingsOpen(true);
  };

  // Handle settings close
  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  // Use custom menu items if provided
  const finalMenuItems = customMenuItems || menuItems;

  // Get current color scheme for dynamic button styling
  const currentColorScheme = colorSchemesService.getColorScheme(
    config.colorScheme
  );
  const primaryColor = currentColorScheme.primary[600];
  const primaryHoverColor = currentColorScheme.primary[700];

  return (
    <>
      {/* Adaptive Layout */}
      <AdaptiveLayout
        menuItems={finalMenuItems}
        activeMenu={activeMenu}
        expandedMenus={expandedMenus}
        user={user}
        applicationTitle={applicationTitle}
        isSidebarCollapsed={isCollapsed}
        enableSearch={enableSearch}
        searchPlaceholder={searchPlaceholder}
        onLogout={handleLogout}
        onMenuChange={handleMenuClick}
        onMenuToggle={handleMenuToggle}
        onCollapseToggle={handleCollapseToggle}
        onSearch={handleSearch}
      >
        {children}
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
};

export default MenuSystem;
