"use client";

import React from "react";
import { MenuItem, User } from "../../../types/menu";
import { iconMappingService } from "../../../services/icon-mapping/icon-mapping.service";
import { useLanguage } from "../../../contexts/language-context";

interface VerticalMenuProps {
  menuItems: MenuItem[];
  activeMenu: string;
  expandedMenus: string[];
  user: User | null;
  applicationTitle: string;
  isCollapsed: boolean;
  onLogout?: () => void;
  onMenuClick: (menuId: string) => void;
  onMenuToggle: (menuId: string) => void;
  onCollapseToggle: () => void;
  className?: string;
}

const VerticalMenu: React.FC<VerticalMenuProps> = ({
  menuItems,
  activeMenu,
  expandedMenus,
  user,
  applicationTitle,
  isCollapsed,
  onLogout,
  onMenuClick,
  onMenuToggle,
  onCollapseToggle,
  className = "",
}) => {
  const { t, isRTL } = useLanguage();
  const rtldir = isRTL ? "rtl" : "ltr";
  // Handle menu click
  const handleMenuClick = (menuId: string) => {
    console.log("VerticalMenu: handleMenuClick called with:", menuId);
    onMenuClick(menuId);
  };

  // Handle menu toggle (for submenus)
  const handleMenuToggle = (menuId: string) => {
    onMenuToggle(menuId);
  };

  // Handle logout
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Get icon class using the icon mapping service
  const getIconClass = (icon?: string): string => {
    if (!icon) return "fas fa-circle";
    return iconMappingService.getIconClass(icon);
  };

  // Check if menu item has submenu
  const hasSubmenu = (item: MenuItem): boolean => {
    return !!(item.submenu && item.submenu.length > 0);
  };

  // Check if submenu is active
  const isSubmenuActive = (menuId: string): boolean => {
    return expandedMenus.includes(menuId);
  };

  return (
    <aside
      className={`bg-primary-800 dark:bg-primary-900 text-white h-full flex flex-col transition-all duration-300 ease-in-out relative ${
        isCollapsed ? "w-16" : "w-64"
      } ${className}`}
      dir={rtldir}
    >
      {/* Header - Fixed at top */}
      <div className="p-4 border-b border-primary-700 dark:border-primary-600 relative">
        <div className="flex items-center justify-between">
          <div
            className={`transition-opacity duration-300 ${
              !isCollapsed ? "opacity-100" : "opacity-0"
            }`}
          >
            <h1 className="text-2xl font-bold whitespace-nowrap">
              {applicationTitle}
            </h1>
            <p className="text-base text-gray-300 whitespace-nowrap">
              {user?.name || "User"}
            </p>
            <p className="text-sm text-gray-400 whitespace-nowrap">
              {user?.roles?.join(", ") || "No Role"}
            </p>
          </div>

          {/* Toggle button */}
          <button
            onClick={onCollapseToggle}
            className={`p-1 hover:bg-primary-700 dark:hover:bg-primary-600 rounded transition-colors absolute ${
              !isCollapsed
                ? "top-4 right-4"
                : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i
              className={
                isCollapsed ? "fas fa-chevron-right" : "fas fa-chevron-left"
              }
            />
          </button>
        </div>
      </div>

      {/* Navigation - Scrollable area */}
      <nav
        dir={rtldir}
        className="flex-1 py-4 overflow-y-auto overflow-x-hidden sidebar-scroll"
      >
        <div dir={rtldir} className={!isCollapsed ? "space-y-1" : "space-y-0"}>
          {menuItems.map((menuItem, i) => (
            <div key={menuItem.id} className="relative group">
              <button
                onClick={() => {
                  console.log(
                    "VerticalMenu: Button clicked for:",
                    menuItem.id,
                    "Has submenu:",
                    hasSubmenu(menuItem)
                  );
                  if (hasSubmenu(menuItem)) {
                    handleMenuToggle(menuItem.id);
                  } else {
                    handleMenuClick(menuItem.id);
                  }
                }}
                className={`w-full flex items-center text-left transition-all duration-200 group ${
                  !isCollapsed ? "px-4 py-3" : "px-2 py-2"
                } ${
                  activeMenu === menuItem.id
                    ? "bg-primary-600 hover:bg-primary-600"
                    : "hover:bg-primary-700 dark:hover:bg-primary-600"
                } ${
                  hasSubmenu(menuItem) && activeMenu !== menuItem.id
                    ? "hover:pl-5"
                    : ""
                }`}
                title={isCollapsed ? menuItem.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    {getIconClass(menuItem.icon).startsWith("fas") ? (
                      <i className={`${getIconClass(menuItem.icon)} text-lg`} />
                    ) : (
                      <span className="text-lg">{menuItem.icon}</span>
                    )}
                  </div>
                  <span
                    className={`text-base whitespace-nowrap transition-all duration-300 ${
                      !isCollapsed
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2"
                    }`}
                  >
                    {t(menuItem.label)}
                  </span>
                </div>

                {/* Submenu arrow */}
                {hasSubmenu(menuItem) && !isCollapsed && (
                  <div className="flex-shrink-0">
                    <i
                      className={`fas ${
                        isRTL ? "fa-chevron-left" : "fa-chevron-right"
                      } transition-transform duration-200 ease-in-out ${
                        isSubmenuActive(menuItem.id)
                          ? isRTL
                            ? "-rotate-90"
                            : "rotate-90"
                          : "rotate-0"
                      }`}
                    />
                  </div>
                )}
              </button>

              {/* Submenu */}
              {hasSubmenu(menuItem) && !isCollapsed && (
                <div
                  className={`ml-8 overflow-hidden transition-all duration-300 ease-out ${
                    isSubmenuActive(menuItem.id)
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="py-1 space-y-1">
                    {menuItem.submenu?.map((subItem, j) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleMenuClick(subItem.id)}
                        className={`w-full flex items-center gap-2 text-left px-4 py-2 text-base rounded transition-all duration-300 ease-out transform ${
                          activeMenu === subItem.id
                            ? "bg-primary-600 hover:bg-primary-700 text-white"
                            : "text-gray-300 hover:bg-primary-700 dark:hover:bg-primary-600 hover:text-white"
                        } ${
                          isSubmenuActive(menuItem.id)
                            ? "translate-y-0 opacity-100 scale-100"
                            : "translate-y-2 opacity-0 scale-95"
                        }`}
                        style={{
                          transitionDelay: isSubmenuActive(menuItem.id)
                            ? `${j * 50}ms`
                            : "0ms",
                        }}
                      >
                        {getIconClass(subItem.icon).startsWith("fas") ? (
                          <i
                            className={`${getIconClass(subItem.icon)} text-sm`}
                          />
                        ) : (
                          <span className="text-sm">{subItem.icon}</span>
                        )}
                        <span className="whitespace-nowrap">
                          {t(subItem.label)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute top-0 left-full ml-2 px-2 py-1 bg-primary-800 dark:bg-primary-900 text-white text-sm font-medium rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {t(menuItem.label)}
                  {hasSubmenu(menuItem) && menuItem.submenu && (
                    <div className="mt-1 space-y-1 border-t border-gray-600 pt-1">
                      {menuItem.submenu.map((subItem) => (
                        <div
                          key={subItem.id}
                          className="text-xs font-medium text-gray-300"
                        >
                          {t(subItem.label)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div
        dir={rtldir}
        className="flex-shrink-0 p-4 border-t border-primary-700 dark:border-primary-600"
      >
        <button
          onClick={handleLogoutClick}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-primary-700 dark:hover:bg-primary-600 rounded transition-colors ${
            isCollapsed ? "px-2" : ""
          }`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <div className="flex-shrink-0">
            <i className="fas fa-sign-out-alt text-lg" />
          </div>
          <span
            className={`text-base whitespace-nowrap transition-all duration-300 ${
              !isCollapsed
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-2"
            }`}
          >
            {t("common.logout")}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default VerticalMenu;
