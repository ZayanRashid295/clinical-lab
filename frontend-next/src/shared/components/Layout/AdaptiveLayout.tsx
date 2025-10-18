import React, { useState, useEffect } from "react";
import { MenuItem } from "../../../app/types/menu";
import { useUIConfigContext } from "../../contexts/UIConfigContext";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useLanguage } from "../../contexts/LanguageContext";
import Sidebar from "../Navigation/Sidebar";
import HorizontalMenu from "../Navigation/HorizontalMenu";
import Header from "./Header";

interface AdaptiveLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  activeMenu: string;
  expandedMenus: string[];
  user: any;
  applicationTitle: string;
  onMenuChange: (menuId: string) => void;
  onToggleMenu: (menuId: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
}

const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({
  children,
  menuItems,
  activeMenu,
  expandedMenus,
  user,
  applicationTitle,
  onMenuChange,
  onToggleMenu,
  isSidebarCollapsed = false,
  onToggleCollapse,
  enableSearch = true,
  searchPlaceholder = "Search...",
  onSearch,
  onLogout,
}) => {
  const { config } = useUIConfigContext();
  const { isRTL } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLayoutSwitchNotification, setShowLayoutSwitchNotification] =
    useState(false);

  // Use responsive layout hook to determine if we should switch to vertical mode
  const { shouldUseVerticalLayout, isMobile, isTablet } = useResponsiveLayout(
    config.menuLayout
  );

  // Determine the actual layout to use
  // If user prefers horizontal but screen is too small, switch to vertical
  const isHorizontalLayout =
    config.menuLayout === "horizontal" && !shouldUseVerticalLayout;

  // Show notification when layout switches automatically
  useEffect(() => {
    if (config.menuLayout === "horizontal" && shouldUseVerticalLayout) {
      setShowLayoutSwitchNotification(true);
      const timer = setTimeout(() => {
        setShowLayoutSwitchNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldUseVerticalLayout, config.menuLayout]);

  // Close mobile menu when switching layouts or when responsive layout changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [config.menuLayout, shouldUseVerticalLayout]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (isHorizontalLayout) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
        {/* Layout Switch Notification */}
        {showLayoutSwitchNotification && (
          <div className="fixed top-4 right-4 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ease-in-out">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                Layout switched to vertical for better mobile experience
              </span>
              <button
                onClick={() => setShowLayoutSwitchNotification(false)}
                className="text-white hover:text-gray-200 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Horizontal Menu */}
        <HorizontalMenu
          menuItems={menuItems}
          activeMenu={activeMenu}
          user={user}
          applicationTitle={applicationTitle}
          onMenuChange={onMenuChange}
          onLogout={onLogout || (() => {})}
        />

        {/* Content Area */}
        <div className="flex-1">
          {/* Optional Header for horizontal layout */}
          {config.menuStyle === "topbar" && (
            <Header
              user={user}
              enableSearch={enableSearch}
              searchPlaceholder={searchPlaceholder}
              onLogout={onLogout || (() => {})}
              isSidebarCollapsed={false}
              onMobileMenuToggle={handleMobileMenuToggle}
              onSidebarToggle={() => {}}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Vertical Layout (existing sidebar layout)
  return (
    <div
      className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${
        isRTL ? "flex-row-reverse" : ""
      }`}
    >
      {/* Layout Switch Notification */}
      {showLayoutSwitchNotification && (
        <div className="fixed top-4 right-4 z-50 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ease-in-out">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              Layout switched to vertical for better mobile experience
            </span>
            <button
              onClick={() => setShowLayoutSwitchNotification(false)}
              className="text-white hover:text-gray-200 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Show on desktop or when forced to vertical mode */}
      <div className={`${isMobile ? "hidden" : "block"}`}>
        <Sidebar
          menuItems={menuItems}
          activeMenu={activeMenu}
          expandedMenus={expandedMenus}
          user={user}
          applicationTitle={applicationTitle}
          onMenuChange={onMenuChange}
          onToggleMenu={onToggleMenu}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleMobileMenuToggle}
          />
          <div
            className={`fixed top-0 h-full w-64 z-50 ${
              isRTL ? "right-0" : "left-0"
            }`}
          >
            <Sidebar
              menuItems={menuItems}
              activeMenu={activeMenu}
              expandedMenus={expandedMenus}
              user={user}
              applicationTitle={applicationTitle}
              onMenuChange={onMenuChange}
              onToggleMenu={onToggleMenu}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          user={user}
          enableSearch={enableSearch}
          searchPlaceholder={searchPlaceholder}
          isSidebarCollapsed={isSidebarCollapsed}
          onLogout={onLogout || (() => {})}
          onMobileMenuToggle={handleMobileMenuToggle}
          onSidebarToggle={onToggleCollapse}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdaptiveLayout;
