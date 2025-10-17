import React, { useState, useRef, useEffect } from "react";
import { MenuItem } from "../../../app/types/menu";
import { iconMap } from "../Common/IconMap";
import { useTheme } from "../../../hooks/useTheme";
import { Home, ChevronDown, ChevronRight } from "lucide-react";

interface HorizontalMenuProps {
  menuItems: MenuItem[];
  activeMenu: string;
  user: any;
  applicationTitle: string;
  onMenuChange: (menuId: string) => void;
  onLogout?: () => void;
  className?: string;
}

const HorizontalMenu: React.FC<HorizontalMenuProps> = ({
  menuItems,
  activeMenu,
  user,
  applicationTitle,
  onMenuChange,
  onLogout,
  className = "",
}) => {
  const { config } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const menuItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInsideDropdown = Object.values(dropdownRefs.current).some(
        (ref) => ref && ref.contains(target)
      );

      if (!isInsideDropdown) {
        setActiveDropdown(null);
      }
    };

    const handleResize = () => {
      if (activeDropdown) {
        const menuItemElement = menuItemRefs.current[activeDropdown];
        if (menuItemElement) {
          const rect = menuItemElement.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
          });
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [activeDropdown]);

  const handleItemClick = (item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      const menuItemElement = menuItemRefs.current[item.id];
      if (menuItemElement) {
        const rect = menuItemElement.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
      setActiveDropdown(activeDropdown === item.id ? null : item.id);
    } else {
      onMenuChange(item.id);
      setActiveDropdown(null);
    }
  };

  const handleSubmenuClick = (subItem: MenuItem) => {
    onMenuChange(subItem.id);
    setActiveDropdown(null);
  };

  return (
    <>
      <style jsx>{`
        .horizontal-menu {
          background: linear-gradient(
            135deg,
            var(--color-primary-800) 0%,
            var(--color-primary-900) 100%
          );
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1000;
        }

        .menu-item {
          position: relative;
          transition: all 0.2s ease;
          z-index: 1001;
        }

        .menu-item:hover {
          background: rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.1);
        }

        .menu-item.active {
          background: rgba(var(--color-primary-500-rgb, 59, 130, 246), 0.2);
          border-bottom: 2px solid var(--color-primary-500);
        }

        .menu-item:has(.dropdown.open) {
          z-index: 10001;
        }

        .menu-item.dropdown-open {
          z-index: 10001;
        }

        .dropdown {
          position: fixed;
          min-width: 200px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          opacity: 0;
          transform: translateY(-10px);
          transition: all 0.2s ease;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dropdown.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
          z-index: 10000;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 12px 16px;
          color: #374151;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item:first-child {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }

        .dropdown-item:last-child {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }

        .dropdown-item:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .dropdown-item.active {
          background: var(--color-primary-100);
          color: var(--color-primary-700);
        }

        .user-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
          margin-left: auto;
        }

        .app-title {
          font-weight: 700;
          font-size: 1.25rem;
          color: white;
        }

        .user-name {
          font-size: 0.875rem;
          color: white;
          font-weight: 500;
        }

        .user-role {
          font-size: 0.75rem;
          color: #d1d5db;
        }

        /* Utility classes for layout */
        .flex-shrink-0 {
          flex-shrink: 0;
        }

        .flex-1 {
          flex: 1 1 0%;
        }

        .min-w-max {
          min-width: max-content;
        }

        .whitespace-nowrap {
          white-space: nowrap;
        }

        .overflow-x-auto {
          overflow-x: auto;
        }

        /* Gradient fade effects */
        .bg-gradient-to-r {
          background-image: linear-gradient(to right, var(--tw-gradient-stops));
        }

        .bg-gradient-to-l {
          background-image: linear-gradient(to left, var(--tw-gradient-stops));
        }

        .from-gray-900 {
          --tw-gradient-from: #111827;
          --tw-gradient-stops: var(--tw-gradient-from),
            var(--tw-gradient-to, rgba(17, 24, 39, 0));
        }

        .to-transparent {
          --tw-gradient-to: transparent;
        }

        .absolute {
          position: absolute;
        }

        .left-0 {
          left: 0;
        }

        .right-0 {
          right: 0;
        }

        .top-0 {
          top: 0;
        }

        .bottom-0 {
          bottom: 0;
        }

        .w-4 {
          width: 1rem;
        }

        .pointer-events-none {
          pointer-events: none;
        }

        .z-10 {
          z-index: 10;
        }

        .px-4 {
          padding-left: 1rem;
          padding-right: 1rem;
        }

        /* Flexbox utilities */
        .flex {
          display: flex;
        }

        .flex-direction-column {
          flex-direction: column;
        }

        .block {
          display: block;
        }

        .w-full {
          width: 100%;
        }

        .text-left {
          text-align: left;
        }

        .logout-btn {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          margin-left: 8px;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.3);
        }

        /* Scrollbar hiding for webkit browsers */
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        /* Responsive adjustments - Enhanced for smooth transitions */
        @media (max-width: 1024px) {
          .horizontal-menu {
            transition: all 0.3s ease-in-out;
          }

          .app-title {
            font-size: 1.1rem;
            transition: all 0.3s ease-in-out;
          }

          .user-name {
            font-size: 0.8rem;
            transition: all 0.3s ease-in-out;
          }

          .user-role {
            font-size: 0.7rem;
            transition: all 0.3s ease-in-out;
          }
        }

        @media (max-width: 768px) {
          .horizontal-menu {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            transition: all 0.3s ease-in-out;
          }

          .horizontal-menu .flex {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            transition: all 0.3s ease-in-out;
          }

          .app-title {
            text-align: center;
            margin-right: 0;
            margin-bottom: 0.5rem;
            font-size: 1.2rem;
            transition: all 0.3s ease-in-out;
          }

          .user-info {
            margin-left: 0;
            margin-top: 0;
            width: 100%;
            order: 3;
            transition: all 0.3s ease-in-out;
          }

          .user-info .flex {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease-in-out;
          }

          .logout-btn {
            margin-left: 0;
            align-self: center;
            transition: all 0.3s ease-in-out;
          }

          /* Make menu items scrollable on mobile */
          .flex-1 {
            order: 2;
            width: 100%;
            transition: all 0.3s ease-in-out;
          }

          .menu-item {
            margin-bottom: 0.5rem;
            transition: all 0.3s ease-in-out;
          }

          .dropdown {
            position: static;
            opacity: 1;
            transform: none;
            pointer-events: auto;
            box-shadow: none;
            background: rgba(0, 0, 0, 0.1);
            margin-top: 0.5rem;
            border-radius: 4px;
            transition: all 0.3s ease-in-out;
          }

          /* Smooth transition for menu items */
          .menu-item button {
            transition: all 0.3s ease-in-out;
            padding: 12px 16px;
          }
        }

        /* Tablet adjustments */
        @media (max-width: 1024px) and (min-width: 769px) {
          .app-title {
            font-size: 1rem;
          }

          .user-name {
            font-size: 0.8rem;
          }

          .user-role {
            font-size: 0.7rem;
          }

          .logout-btn {
            padding: 4px 8px;
            font-size: 0.7rem;
          }
        }
      `}</style>

      <nav className={`horizontal-menu ${className}`}>
        <div className="flex items-center px-6 py-4">
          {/* Application Title - Fixed on left */}
          <div className="app-title flex-shrink-0 mr-6">{applicationTitle}</div>

          {/* Scrollable Menu Items Container */}
          <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide relative">
            {/* Gradient fade indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none z-10"></div>

            <div className="flex items-center space-x-1 min-w-max px-4">
              {menuItems.map((item) => {
                const IconComponent = iconMap[item.icon] || Home;
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isActive = activeMenu === item.id;
                const isDropdownOpen = activeDropdown === item.id;
                const isHovered = hoveredItem === item.id;

                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      menuItemRefs.current[item.id] = el;
                    }}
                    className={`menu-item ${isActive ? "active" : ""} ${
                      isDropdownOpen ? "dropdown-open" : ""
                    }`}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <button
                      onClick={() => handleItemClick(item)}
                      className="flex items-center space-x-2 px-4 py-3 text-white hover:text-blue-300 transition-colors duration-200 whitespace-nowrap"
                    >
                      <IconComponent size={18} />
                      <span className="font-medium">{item.label}</span>
                      {hasSubmenu && (
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {hasSubmenu && (
                      <div
                        ref={(el) => {
                          dropdownRefs.current[item.id] = el;
                        }}
                        className={`dropdown ${isDropdownOpen ? "open" : ""}`}
                        style={{
                          top: isDropdownOpen
                            ? `${dropdownPosition.top}px`
                            : "auto",
                          left: isDropdownOpen
                            ? `${dropdownPosition.left}px`
                            : "auto",
                        }}
                      >
                        {item.submenu?.map((subItem) => {
                          const SubIconComponent =
                            iconMap[subItem.icon] || Home;
                          const isSubActive = activeMenu === subItem.id;

                          return (
                            <button
                              key={subItem.id}
                              onClick={() => handleSubmenuClick(subItem)}
                              className={`dropdown-item ${
                                isSubActive ? "active" : ""
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <SubIconComponent size={16} />
                                <span className="font-medium">
                                  {subItem.label}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Info - Fixed on right */}
          <div className="user-info flex-shrink-0 ml-6">
            <div className="flex items-center">
              <div>
                <div className="user-name">{user?.name || "User"}</div>
                <div className="user-role">
                  {user?.roles?.join(", ") || "No Role"}
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="logout-btn"
                  title="Logout"
                >
                  🚪 Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default HorizontalMenu;
