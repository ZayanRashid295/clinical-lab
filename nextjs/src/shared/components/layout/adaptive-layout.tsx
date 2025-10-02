"use client";

import React, { useState, useEffect } from "react";
import { MenuItem, User } from "../../types/menu";
import { useResponsiveLayout } from "../../services/responsive/responsive.service";
import HorizontalMenu from "../navigation/horizontal-menu/horizontal-menu";
import VerticalMenu from "../navigation/vertical-menu/vertical-menu";
import { useLanguage } from "../../contexts/language-context";
import { useTheme } from "../../contexts/theme-context";

interface AdaptiveLayoutProps {
  menuItems: MenuItem[];
  activeMenu: string;
  expandedMenus: string[];
  user: User | null;
  applicationTitle: string;
  isSidebarCollapsed: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onLogout?: () => void;
  onMenuChange: (menuId: string) => void;
  onMenuToggle: (menuId: string) => void;
  onCollapseToggle: () => void;
  onSearch?: (query: string) => void;
  children: React.ReactNode;
}

const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({
  menuItems,
  activeMenu,
  expandedMenus,
  user,
  applicationTitle,
  isSidebarCollapsed,
  enableSearch = true,
  searchPlaceholder = "Search...",
  onLogout,
  onMenuChange,
  onMenuToggle,
  onCollapseToggle,
  onSearch,
  children,
}) => {
  const responsiveState = useResponsiveLayout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isRTL } = useLanguage();
  const { config } = useTheme();

  // Ensure client-side rendering to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine layout based on theme config and responsive state
  // Horizontal menu only available on desktop (large screens >= 1024px)
  // Mobile and tablet always use vertical layout for better UX
  // Use default vertical layout during SSR to prevent hydration mismatch
  const isHorizontalLayout =
    isClient && responsiveState.isDesktop && config.menuLayout === "horizontal";

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle mobile menu close
  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when screen size changes
  useEffect(() => {
    if (!responsiveState.isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [responsiveState.isMobile]);

  // Handle search
  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    }
  };

  // Horizontal Layout
  if (isHorizontalLayout) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
        {/* Horizontal Menu */}
        <HorizontalMenu
          menuItems={menuItems}
          activeMenu={activeMenu}
          expandedMenus={expandedMenus}
          user={user}
          applicationTitle={applicationTitle}
          onLogout={onLogout}
          onMenuChange={onMenuChange}
          onMenuToggle={onMenuToggle}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
          {children}
        </main>
      </div>
    );
  }

  // Vertical Layout (Sidebar)
  return (
    <div
      className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${
        isRTL ? "flex-row-reverse" : ""
      }`}
    >
      {/* Desktop/Tablet Sidebar - Show on tablet and desktop, hide on mobile */}
      {!responsiveState.isMobile && (
        <VerticalMenu
          menuItems={menuItems}
          activeMenu={activeMenu}
          expandedMenus={expandedMenus}
          user={user}
          applicationTitle={applicationTitle}
          isCollapsed={isSidebarCollapsed}
          onLogout={onLogout}
          onMenuClick={onMenuChange}
          onMenuToggle={onMenuToggle}
          onCollapseToggle={onCollapseToggle}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && responsiveState.isMobile && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleMobileMenuClose}
          />
          <div
            className={`fixed top-0 h-full w-64 z-50 ${
              isRTL ? "right-0" : "left-0"
            }`}
          >
            {/* Mobile sidebar close button */}
            <button
              onClick={handleMobileMenuClose}
              className={`mobile-close-button p-2 text-white rounded transition-colors absolute top-4 z-10 bg-gray-800 hover:bg-gray-700 ${
                isRTL ? "left-4" : "right-4"
              }`}
              title="Close menu"
            >
              <i className="fas fa-times text-lg" />
            </button>
            <VerticalMenu
              menuItems={menuItems}
              activeMenu={activeMenu}
              expandedMenus={expandedMenus}
              user={user}
              applicationTitle={applicationTitle}
              isCollapsed={false}
              onLogout={onLogout}
              onMenuClick={(menuId) => {
                onMenuChange(menuId);
                handleMobileMenuClose();
              }}
              onMenuToggle={onMenuToggle}
              onCollapseToggle={onCollapseToggle}
            />
          </div>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          isRTL ? "rtl" : "ltr"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <header
          className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 ${
            isRTL ? "rtl" : "ltr"
          }`}
        >
          <div
            className={`flex items-center justify-between ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            {/* Mobile menu toggle */}
            {responsiveState.isMobile && (
              <button
                onClick={handleMobileMenuToggle}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-bars text-lg" />
              </button>
            )}

            {/* Desktop sidebar toggle */}
            {!responsiveState.isMobile && (
              <button
                onClick={onCollapseToggle}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                <i
                  className={`fas ${
                    isSidebarCollapsed
                      ? isRTL
                        ? "fa-chevron-left"
                        : "fa-chevron-right"
                      : isRTL
                      ? "fa-chevron-right"
                      : "fa-chevron-left"
                  } text-lg`}
                />
              </button>
            )}

            {/* Search */}
            {enableSearch && (
              <div className="flex-1 max-w-md mx-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    onChange={(e) => handleSearch(e.target.value)}
                    className={`w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isRTL ? "pr-10" : "pl-10"
                    }`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                  <i
                    className={`fas fa-search absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${
                      isRTL ? "right-3" : "left-3"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* User info and logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roles?.join(", ") || "No Role"}
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt text-lg" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdaptiveLayout;
