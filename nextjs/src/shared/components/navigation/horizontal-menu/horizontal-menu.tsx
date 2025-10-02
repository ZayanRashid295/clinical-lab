"use client";

import React, { useState, useRef, useEffect } from "react";
import { MenuItem, User } from "../../../types/menu";
import { useTheme } from "../../../contexts/theme-context";
import { colorSchemesService } from "../../../services/theme/color-schemes/color-schemes.service";
import { iconMappingService } from "../../../services/icon-mapping/icon-mapping.service";
import { useLanguage } from "../../../contexts/language-context";

interface HorizontalMenuProps {
  menuItems: MenuItem[];
  activeMenu: string;
  expandedMenus: string[];
  user: User | null;
  applicationTitle: string;
  onLogout?: () => void;
  onMenuChange: (menuId: string) => void;
  onMenuToggle: (menuId: string) => void;
  className?: string;
}

const HorizontalMenu: React.FC<HorizontalMenuProps> = ({
  menuItems,
  activeMenu,
  expandedMenus,
  user,
  applicationTitle,
  onLogout,
  onMenuChange,
  onMenuToggle,
  className = "",
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get theme colors and language context
  const { config } = useTheme();
  const colorScheme = colorSchemesService.getColorScheme(config.colorScheme);
  const primaryColors = colorScheme.primary;
  const { t, isRTL } = useLanguage();
  const rtldir = isRTL ? "rtl" : "ltr";

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle dropdown positioning - calculate fixed position
  const updateDropdownPosition = (itemId: string) => {
    const menuItem = dropdownRefs.current[itemId];
    if (menuItem) {
      const rect = menuItem.getBoundingClientRect();
      const dropdownWidth = 200; // Default dropdown width

      if (isRTL) {
        // For RTL, calculate position from right edge of viewport
        // We need to account for the menu item's position relative to the viewport
        const rightPosition = window.innerWidth - rect.right;
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rightPosition, // This will be used as 'right' value
        });
      } else {
        // For LTR, calculate position from left edge
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    }
  };

  // Handle item click
  const handleItemClick = (item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      if (activeDropdown === item.id) {
        setActiveDropdown(null);
      } else {
        updateDropdownPosition(item.id);
        setActiveDropdown(item.id);
      }
      onMenuToggle(item.id);
    } else {
      setActiveDropdown(null);
      onMenuChange(item.id);
    }
  };

  // Handle submenu click
  const handleSubmenuClick = (subItem: MenuItem) => {
    setActiveDropdown(null);
    onMenuChange(subItem.id);
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest(".menu-item")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  return (
    <nav
      className={`horizontal-menu text-white ${className}`}
      style={{
        backgroundColor: primaryColors[800] || "#1e40af", // Fallback to blue-800
      }}
    >
      <div dir={rtldir} className="flex items-center px-6 py-4">
        {/* Application Title */}
        <div className="app-title flex-shrink-0 text-xl font-bold">
          {applicationTitle}
        </div>

        {/* Vertical Separator Line */}
        <div className="flex-shrink-0 w-px h-8 bg-gray-300/30 mx-4"></div>

        {/* Mobile Menu Toggle Button */}
        {isMobile && (
          <button
            className="mobile-menu-toggle flex items-center justify-between w-full px-4 py-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: primaryColors[700],
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryColors[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColors[700];
            }}
            onClick={handleMobileMenuToggle}
          >
            <span>Menu</span>
            <span
              className={`transition-transform duration-200 ${
                isMobileMenuOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>
        )}

        {/* Scrollable Menu Items Container */}
        {!isMobile && (
          <div
            ref={menuContainerRef}
            dir={rtldir}
            className="flex-1 flex items-center overflow-x-auto scrollbar-hide relative"
          >
            <div
              dir={rtldir}
              className="flex items-center min-w-max px-4 gap-x-1"
            >
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  ref={(el) => {
                    dropdownRefs.current[item.id] = el;
                  }}
                  className={`menu-item relative ${
                    activeMenu === item.id ? "active" : ""
                  } ${activeDropdown === item.id ? "dropdown-open" : ""}`}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center gap-x-2 px-4 py-3 text-white hover:text-blue-300 transition-colors duration-200 whitespace-nowrap ${
                      activeMenu === item.id ? "text-blue-300" : ""
                    }`}
                  >
                    {getIconClass(item.icon).startsWith("fas") ? (
                      <i className={getIconClass(item.icon)} />
                    ) : (
                      <span>{item.icon}</span>
                    )}
                    <span className="font-medium">{t(item.label)}</span>
                    {item.submenu && item.submenu.length > 0 && (
                      <i
                        className={`fas fa-chevron-down transition-transform duration-200 ${
                          activeDropdown === item.id ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {item.submenu && item.submenu.length > 0 && (
                    <div
                      className={`dropdown ${
                        activeDropdown === item.id ? "open" : ""
                      }`}
                      style={{
                        top: `${dropdownPosition.top}px`,
                        ...(isRTL
                          ? { right: `${dropdownPosition.left}px` }
                          : { left: `${dropdownPosition.left}px` }),
                      }}
                    >
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleSubmenuClick(subItem)}
                          className={`dropdown-item ${
                            activeMenu === subItem.id ? "active" : ""
                          }`}
                        >
                          <div className="flex items-center gap-x-3">
                            {getIconClass(subItem.icon).startsWith("fas") ? (
                              <i className={getIconClass(subItem.icon)} />
                            ) : (
                              <span>{subItem.icon}</span>
                            )}
                            <span className="font-medium">
                              {t(subItem.label)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Info */}
        <div
          dir={rtldir}
          className="user-info flex-shrink-0 flex items-center gap-x-4"
        >
          {/* Vertical Separator Line */}
          <div className="flex-shrink-0 w-px h-8 bg-gray-300/30 mr-4"></div>
          <div className="user-text-block">
            <div className="user-name text-sm font-medium">
              {user?.name || "Admin User"}
            </div>
            <div className="user-role text-xs text-gray-400">
              {user?.roles?.join(", ") || "ADMIN"}
            </div>
          </div>
          {onLogout && (
            <button
              onClick={handleLogoutClick}
              className="logout-btn flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt text-sm" />
              <span className="hidden sm:inline">{t("common.logout")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && (
        <div
          className={`mobile-menu border-t transition-all duration-300 ${
            isMobileMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
          style={{
            backgroundColor: primaryColors[700],
            borderColor: primaryColors[600],
          }}
        >
          {menuItems.map((item) => (
            <div key={item.id} className="mobile-menu-item">
              <button
                onClick={() => handleItemClick(item)}
                className={`flex items-center justify-between w-full px-4 py-3 text-left hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors duration-200 ${
                  activeMenu === item.id
                    ? "bg-primary-600 dark:bg-primary-700 text-blue-300"
                    : "text-white"
                }`}
              >
                <div className="flex items-center gap-x-3">
                  {getIconClass(item.icon).startsWith("fas") ? (
                    <i className={getIconClass(item.icon)} />
                  ) : (
                    <span>{item.icon}</span>
                  )}
                  <span className="font-medium">{t(item.label)}</span>
                </div>
                {item.submenu && item.submenu.length > 0 && (
                  <span
                    className={`transition-transform duration-200 ${
                      activeDropdown === item.id ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                )}
              </button>

              {/* Mobile Dropdown */}
              {item.submenu &&
                item.submenu.length > 0 &&
                activeDropdown === item.id && (
                  <div
                    className="mobile-dropdown"
                    style={{
                      backgroundColor: primaryColors[800],
                    }}
                  >
                    {item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubmenuClick(subItem)}
                        className={`mobile-dropdown-item w-full flex items-center px-8 py-2 hover:bg-primary-700 dark:hover:bg-primary-800 transition-colors duration-200 gap-x-3 text-left ${
                          activeMenu === subItem.id
                            ? "bg-primary-700 dark:bg-primary-800 text-blue-300"
                            : "text-gray-300"
                        }`}
                      >
                        {getIconClass(subItem.icon).startsWith("fas") ? (
                          <i className={getIconClass(subItem.icon)} />
                        ) : (
                          <span>{subItem.icon}</span>
                        )}
                        <span>{t(subItem.label)}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}

          {/* Mobile Logout Button */}
          {onLogout && (
            <div className="mobile-menu-item border-t border-gray-600 mt-2 pt-2">
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-x-3 w-full px-4 py-3 text-left text-red-300 hover:bg-red-500/20 transition-colors duration-200"
              >
                <i className="fas fa-sign-out-alt" />
                <span className="font-medium">{t("common.logout")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default HorizontalMenu;
